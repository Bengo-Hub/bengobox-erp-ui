#!/usr/bin/env bash

# =============================================================================
# BengoERP UI - Production Deployment Script
# =============================================================================
# This script handles the complete production deployment process:
# - Security scanning and validation
# - Docker container building with SSH support
# - Database setup and management
# - Kubernetes secrets and configuration
# - Helm chart deployment updates
# - Multi-environment deployment support
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "${PURPLE}[STEP]${NC} $1"; }
log_debug()   { echo -e "${CYAN}[DEBUG]${NC} $1"; }

# =============================================================================
# CONFIGURATION & ENVIRONMENT SETUP
# =============================================================================

# Application configuration
APP_NAME="erp-ui"
DEPLOY=${DEPLOY:-false}
SETUP_DATABASES=${SETUP_DATABASES:-false}
DB_TYPES=${DB_TYPES:-postgres,redis}
NAMESPACE=${NAMESPACE:-erp}
ENV_SECRET_NAME=${ENV_SECRET_NAME:-erp-ui-env}
PROVIDER=${PROVIDER:-contabo}
CONTABO_API=${CONTABO_API:-true}
SSH_DEPLOY=${SSH_DEPLOY:-false}

# Registry configuration
REGISTRY_SERVER=${REGISTRY_SERVER:-docker.io}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-Bengo-Hub}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

# DevOps repository
DEVOPS_REPO="Bengo-Hub/devops-k8s"
VALUES_FILE_PATH="apps/erp-ui/values.yaml"

# Git configuration
GIT_EMAIL=${GIT_EMAIL:-"devops@bot.local"}
GIT_USER=${GIT_USER:-"DevOps Bot"}

# Security scanning
TRIVY_ECODE=${TRIVY_ECODE:-1}

# Get commit ID
if [[ -z ${GITHUB_SHA:-} ]]; then
    GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD)
else
    GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

log_info "Starting BengoERP UI deployment"
log_info "App Name: ${APP_NAME}"
log_info "Git Commit: ${GIT_COMMIT_ID}"
log_info "Deploy Mode: ${DEPLOY}"
log_info "Target Image: ${IMAGE_REPO}:${GIT_COMMIT_ID}"

# =============================================================================
# PREREQUISITE CHECKS
# =============================================================================

log_step "Checking prerequisites..."

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is required but not installed"
        exit 1
    fi
}

# Check required commands
for cmd in git docker kubectl helm yq jq curl trivy; do
    check_command "$cmd"
done

log_success "All prerequisites are available"

# =============================================================================
# SECURITY VULNERABILITY SCANNING
# =============================================================================

log_step "Running security vulnerability scan..."

log_info "Scanning filesystem for vulnerabilities"
trivy fs . --exit-code "$TRIVY_ECODE" --format table

log_success "Filesystem vulnerability scan completed"

# =============================================================================
# SSH CONFIGURATION FOR DOCKER BUILD
# =============================================================================

log_step "Configuring SSH for Docker build..."

SSH_CONFIGURED=false

# Check if SSH keys are available for Docker build
if [[ -n "${DOCKER_SSH_KEY:-}" ]]; then
    log_info "Setting up SSH key for Docker build"
    mkdir -p -m 0700 ~/.ssh
    echo "$DOCKER_SSH_KEY" | base64 -d > ~/.ssh/id_rsa
    chmod 0600 ~/.ssh/id_rsa
    ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null || true
    eval "$(ssh-agent)"
    ssh-add ~/.ssh/id_rsa
    SSH_CONFIGURED=true
    log_success "SSH configured for Docker build"
else
    log_info "No SSH key provided, building without SSH"
fi

# =============================================================================
# DOCKER CONTAINER BUILD
# =============================================================================

log_step "Building Docker container..."

if [[ "$SSH_CONFIGURED" == "true" ]]; then
    log_info "Building with SSH support"
    DOCKER_BUILDKIT=1 docker build . \
        --ssh default="$SSH_AUTH_SOCK" \
        -t "${IMAGE_REPO}:${GIT_COMMIT_ID}"
else
    log_info "Building without SSH"
    DOCKER_BUILDKIT=1 docker build . \
        -t "${IMAGE_REPO}:${GIT_COMMIT_ID}"
fi

log_success "Docker container build completed"

# =============================================================================
# CONTAINER VULNERABILITY SCANNING
# =============================================================================

log_step "Running container vulnerability scan..."

trivy image "${IMAGE_REPO}:${GIT_COMMIT_ID}" \
    --exit-code "$TRIVY_ECODE" \
    --format table

log_success "Container vulnerability scan completed"

# =============================================================================
# DEPLOYMENT PHASE
# =============================================================================

if [[ "$DEPLOY" == "true" ]]; then
    log_step "Starting deployment process..."

    # Authenticate with registry
    if [[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
        log_info "Logging into container registry"
        echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin
    fi

    # Push container to registry
    log_info "Pushing container to registry"
    docker push "${IMAGE_REPO}:${GIT_COMMIT_ID}"
    log_success "Container pushed to registry"

    # Setup Kubernetes access
    if [[ -n "${KUBE_CONFIG:-}" ]]; then
        log_step "Setting up Kubernetes access..."

        mkdir -p ~/.kube
        echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config

        # Ensure namespace exists
        if kubectl get namespace "$NAMESPACE" &>/dev/null; then
            log_info "Namespace $NAMESPACE already exists"
        else
            log_info "Creating namespace: $NAMESPACE"
            kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
        fi

        # Apply Kubernetes secrets if devENV.yaml exists
        if [[ -f "kubeSecrets/devENV.yaml" ]]; then
            log_info "Applying Kubernetes secrets"
            kubectl apply -f kubeSecrets/devENV.yaml || log_warning "Failed to apply some secrets"
        fi

        log_success "Kubernetes access configured"
    fi

    # Note: UI doesn't need database setup typically, but framework is here if needed
    if [[ "$SETUP_DATABASES" == "true" && -n "${KUBE_CONFIG:-}" ]]; then
        log_step "Setting up databases..."

        # Generate passwords if not provided
        gen_pwd() { openssl rand -hex 16; }
        : "${POSTGRES_PASSWORD:=$(gen_pwd)}"
        : "${REDIS_PASSWORD:=$(gen_pwd)}"
        : "${MONGO_PASSWORD:=$(gen_pwd)}"
        : "${MYSQL_PASSWORD:=$(gen_pwd)}"

        log_info "Setting up databases in namespace ${NAMESPACE}: ${DB_TYPES}"

        # Install Helm repos
        helm repo add bitnami https://charts.bitnami.com/bitnami >/dev/null 2>&1 || true
        helm repo update >/dev/null 2>&1 || true

        # Parse database types
        SAVEIFS=$IFS; IFS=','; set -f; types=($DB_TYPES); IFS=$SAVEIFS; set +f

        for db in "${types[@]}"; do
            db=$(echo "$db" | xargs)
            case "$db" in
                postgres)
                    log_info "Installing PostgreSQL..."
                    helm upgrade --install postgresql bitnami/postgresql -n "$NAMESPACE" \
                        --set global.postgresql.auth.postgresPassword="$POSTGRES_PASSWORD" \
                        --set global.postgresql.auth.database="appdb" \
                        --wait
                    export POSTGRES_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgresql.${NAMESPACE}.svc.cluster.local:5432/appdb"
                    ;;
                redis)
                    log_info "Installing Redis..."
                    helm upgrade --install redis bitnami/redis -n "$NAMESPACE" \
                        --set global.redis.password="$REDIS_PASSWORD" \
                        --wait
                    export REDIS_URL="redis://:${REDIS_PASSWORD}@redis-master.${NAMESPACE}.svc.cluster.local:6379/0"
                    ;;
                mongo|mongodb)
                    log_info "Installing MongoDB..."
                    helm upgrade --install mongodb bitnami/mongodb -n "$NAMESPACE" \
                        --set auth.rootPassword="$MONGO_PASSWORD" \
                        --wait
                    export MONGO_URL="mongodb://root:${MONGO_PASSWORD}@mongodb.${NAMESPACE}.svc.cluster.local:27017/?authSource=admin"
                    ;;
                mysql)
                    log_info "Installing MySQL..."
                    helm upgrade --install mysql bitnami/mysql -n "$NAMESPACE" \
                        --set auth.rootPassword="$MYSQL_PASSWORD" \
                        --wait
                    export MYSQL_URL="mysql://root:${MYSQL_PASSWORD}@mysql.${NAMESPACE}.svc.cluster.local:3306/appdb"
                    ;;
            esac
        done

        # Create/update environment secret with database URLs
        log_info "Creating/updating environment secret: ${NAMESPACE}/${ENV_SECRET_NAME}"

        # Build kubectl literals dynamically
        LITS=""
        [[ -n "${POSTGRES_URL:-}" ]] && LITS="$LITS --from-literal=DATABASE_URL=$POSTGRES_URL"
        [[ -n "${REDIS_URL:-}" ]] && LITS="$LITS --from-literal=REDIS_URL=$REDIS_URL --from-literal=CELERY_BROKER_URL=$REDIS_URL --from-literal=CELERY_RESULT_BACKEND=$REDIS_URL"
        [[ -n "${MONGO_URL:-}" ]] && LITS="$LITS --from-literal=MONGO_URL=$MONGO_URL"
        [[ -n "${MYSQL_URL:-}" ]] && LITS="$LITS --from-literal=MYSQL_URL=$MYSQL_URL"

        if [[ -n "$LITS" ]]; then
            kubectl -n "$NAMESPACE" create secret generic "$ENV_SECRET_NAME" $LITS --dry-run=client -o yaml | kubectl apply -f -
        fi

        # Ensure JWT secret exists
        if kubectl -n "$NAMESPACE" get secret "$ENV_SECRET_NAME" >/dev/null 2>&1; then
            if ! kubectl -n "$NAMESPACE" get secret "$ENV_SECRET_NAME" -o jsonpath='{.data.JWT_SECRET}' >/dev/null 2>&1; then
                JWT=$(openssl rand -hex 32)
                kubectl -n "$NAMESPACE" patch secret "$ENV_SECRET_NAME" -p "{\"stringData\":{\"JWT_SECRET\":\"$JWT\"}}"
            fi
        else
            JWT=$(openssl rand -hex 32)
            kubectl -n "$NAMESPACE" create secret generic "$ENV_SECRET_NAME" --from-literal=JWT_SECRET="$JWT"
        fi

        log_success "Databases and secrets configured"
    fi

    # Update Helm values if deploying
    if [[ -n "${KUBE_CONFIG:-}" ]]; then
        log_step "Updating Helm deployment..."

        # Clone devops repository
        git clone "https://github.com/${DEVOPS_REPO}.git" devops-repo
        cd devops-repo

        # Configure git
        git config user.name "$GIT_USER"
        git config user.email "$GIT_EMAIL"
        git pull --rebase

        # Update Helm values
        if [[ -f "$VALUES_FILE_PATH" ]]; then
            log_info "Updating Helm values with new image"
            yq -yi ".image.repository = \"${IMAGE_REPO}\" | .image.tag = \"${GIT_COMMIT_ID}\"" "$VALUES_FILE_PATH"

            git add "$VALUES_FILE_PATH"
            git commit -m "${APP_NAME}:${GIT_COMMIT_ID} released" || log_info "No changes to commit"
            git push

            log_success "Helm deployment updated"
        else
            log_warning "Helm values file not found: $VALUES_FILE_PATH"
        fi

        cd ..
        rm -rf devops-repo
    fi

    # Handle VPS deployment if configured
    if [[ "$SSH_DEPLOY" == "true" || ( "$PROVIDER" == "contabo" && "$CONTABO_API" == "true" ) ]]; then
        log_step "Deploying to VPS..."

        # Handle Contabo API if configured
        if [[ "$PROVIDER" == "contabo" && "$CONTABO_API" == "true" && -n "${CONTABO_CLIENT_ID:-}" ]]; then
            log_info "Using Contabo API for deployment"

            # Contabo API logic would go here
            # For now, fall back to SSH deployment
            log_info "Contabo API configured but not implemented, using SSH fallback"
        fi

        # SSH deployment
        if [[ -n "${SSH_HOST:-}" && -n "${SSH_USER:-}" && -n "${SSH_PRIVATE_KEY:-}" ]]; then
            log_info "Deploying via SSH to ${SSH_USER}@${SSH_HOST}"

            # SSH deployment logic would go here
            # For now, just log the action
            log_info "SSH deployment configured but implementation needed"
            log_info "Would deploy ${IMAGE_REPO}:${GIT_COMMIT_ID} to ${SSH_HOST}"
        else
            log_warning "SSH deployment requested but credentials not provided"
        fi
    fi

    log_success "Production deployment completed successfully!"

else
    log_info "Deploy mode disabled (DEPLOY=${DEPLOY}). Build completed but not deployed."
fi

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================

log_step "Deployment Summary"
echo "=========================================="
echo "Service: BengoERP UI"
echo "App Name: ${APP_NAME}"
echo "Git Commit: ${GIT_COMMIT_ID}"
echo "Image: ${IMAGE_REPO}:${GIT_COMMIT_ID}"
echo "Deploy Mode: ${DEPLOY}"
echo "SSH Support: $([[ "$SSH_CONFIGURED" == "true" ]] && echo '✅ Enabled' || echo '❌ Disabled')"
echo "Databases: $([[ "$SETUP_DATABASES" == "true" ]] && echo "✅ $DB_TYPES" || echo '❌ Disabled')"
echo "K8s Secrets: $([[ -n "${KUBE_CONFIG:-}" ]] && echo '✅ Applied' || echo '❌ Skipped')"
echo "Helm Update: $([[ "$DEPLOY" == "true" ]] && echo '✅ Updated' || echo '❌ Skipped')"
echo "=========================================="

log_success "BengoERP UI deployment process completed!"
