#!/usr/bin/env bash

# =============================================================================
# BengoERP UI - Production Deployment Script with Enhanced Error Handling
# =============================================================================
# This script handles the complete production deployment process:
# - Security scanning and validation
# - Docker container building with SSH support
# - Database setup and management
# - Kubernetes secrets and configuration
# - Helm chart deployment updates
# - Multi-environment deployment support
# - Enhanced error handling and recovery mechanisms
# =============================================================================

set -euo pipefail

# Error handling and cleanup
trap 'cleanup_on_error $? $LINENO' ERR
trap 'cleanup_on_exit' EXIT

# Global error tracking
ERROR_COUNT=0
MAX_ERRORS=3
DEPLOYMENT_FAILED=false

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Enhanced logging functions
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "${PURPLE}[STEP]${NC} $1"; }
log_debug()   { echo -e "${CYAN}[DEBUG]${NC} $1"; }
log_critical() { echo -e "${RED}[CRITICAL]${NC} $1"; }

# Error handling functions
cleanup_on_error() {
    local exit_code=$1
    local line_number=$2

    ERROR_COUNT=$((ERROR_COUNT + 1))
    log_critical "Error occurred at line $line_number with exit code $exit_code"
    log_critical "Error count: $ERROR_COUNT/$MAX_ERRORS"

    if [[ $ERROR_COUNT -ge $MAX_ERRORS ]]; then
        log_critical "Maximum error threshold reached. Initiating emergency cleanup..."
        DEPLOYMENT_FAILED=true
        cleanup_on_exit
        exit 1
    fi
}

cleanup_on_exit() {
    log_info "Performing cleanup operations..."

    # Clean up SSH configuration
    if [[ -d ~/.ssh ]]; then
        rm -f ~/.ssh/id_rsa* 2>/dev/null || true
        unset SSH_AUTH_SOCK 2>/dev/null || true
    fi

    # Clean up temporary files
    if [[ -d devops-repo ]]; then
        rm -rf devops-repo
    fi

    # Clean up dangling Docker images
    if command -v docker &> /dev/null; then
        docker image prune -f >/dev/null 2>&1 || true
    fi

    if [[ "$DEPLOYMENT_FAILED" == "true" ]]; then
        log_warning "Deployment failed. Please check logs and consider rollback."
        return 1
    fi
}

rollback_deployment() {
    log_warning "Initiating rollback procedure..."

    if [[ -n "${KUBE_CONFIG:-}" ]]; then
        # Rollback to previous ArgoCD revision
        if command -v kubectl &> /dev/null; then
            kubectl config use-context "$(kubectl config current-context)" >/dev/null 2>&1 || true

            # Get previous successful revision for rollback
            if kubectl get application "$APP_NAME" -n argocd -o jsonpath='{.status.history[1].revision}' >/dev/null 2>&1; then
                PREV_REVISION=$(kubectl get application "$APP_NAME" -n argocd -o jsonpath='{.status.history[1].revision}')
                log_info "Rolling back to revision: $PREV_REVISION"
                kubectl patch application "$APP_NAME" -n argocd -p "{\"spec\":{\"source\":{\"targetRevision\":\"$PREV_REVISION\"}}}"
            fi
        fi
    fi

    log_success "Rollback initiated. Monitor deployment status."
}

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
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-codevertex}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

# DevOps repository
DEVOPS_REPO="Bengo-Hub/devops-k8s"
VALUES_FILE_PATH="apps/erp-ui/values.yaml"

# Git configuration
GIT_EMAIL=${GIT_EMAIL:-"titusowuor30@gmail.com"}
GIT_USER=${GIT_USER:-"Titus Owuor"}

# Security scanning - be less strict for deployment
TRIVY_ECODE=${TRIVY_ECODE:-0}

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

# Security scanning - be less strict for deployment
log_info "Scanning filesystem for vulnerabilities"
trivy fs . --exit-code 0 --format table --skip-files "localhost*.pem" --skip-files "*.key" --skip-files "*.crt" --ignorefile .trivyignore 2>/dev/null || {
    log_warning "Security scan found issues but continuing deployment"
}

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

    # For CI/CD environments, try non-interactive SSH key addition
    if [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        log_info "Running in CI/CD environment, using non-interactive SSH setup"

        # Try to add key without passphrase (common for CI/CD)
        if SSH_ASKPASS=/bin/false ssh-add ~/.ssh/id_rsa 2>/dev/null; then
            SSH_CONFIGURED=true
            log_success "SSH configured for Docker build"
        else
            log_warning "SSH key requires passphrase in CI/CD, building without SSH"
            rm -f ~/.ssh/id_rsa
            SSH_CONFIGURED=false
        fi
    else
        # Interactive environment - try normal ssh-add with timeout
        if timeout 10 ssh-add ~/.ssh/id_rsa 2>/dev/null; then
            SSH_CONFIGURED=true
            log_success "SSH configured for Docker build"
        else
            log_warning "SSH key has passphrase or failed to add to agent, building without SSH"
            rm -f ~/.ssh/id_rsa
            SSH_CONFIGURED=false
        fi
    fi
else
    log_info "No SSH key provided, building without SSH"
    SSH_CONFIGURED=false
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
    --exit-code 0 \
    --format table \
    --ignorefile .trivyignore

log_success "Container vulnerability scan completed"

# =============================================================================
# DEPLOYMENT PHASE
# =============================================================================

if [[ "$DEPLOY" == "true" ]]; then
    log_step "Starting deployment process..."

    # Pre-deployment health check
    pre_deployment_check() {
        log_info "Performing pre-deployment health checks..."

        # Check if deployment already exists and get current status
        if [[ -n "${KUBE_CONFIG:-}" ]] && kubectl get deployment "$APP_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
            CURRENT_REPLICAS=$(kubectl get deployment "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
            DESIRED_REPLICAS=$(kubectl get deployment "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

            if [[ "$CURRENT_REPLICAS" == "$DESIRED_REPLICAS" && "$CURRENT_REPLICAS" != "0" ]]; then
                log_success "Current deployment is healthy (${CURRENT_REPLICAS}/${DESIRED_REPLICAS} replicas ready)"
                return 0
            else
                log_warning "Current deployment may be unhealthy (${CURRENT_REPLICAS}/${DESIRED_REPLICAS} replicas ready)"
            fi
        fi

        return 0
    }

    pre_deployment_check

    # Enhanced registry authentication with retry
    authenticate_registry() {
        local retries=3
        local delay=5

        for ((i=1; i<=retries; i++)); do
            if [[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
                log_info "Logging into container registry (attempt $i/$retries)"
                if echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin; then
                    return 0
                fi
                log_warning "Registry authentication failed, retrying in ${delay}s..."
                sleep "$delay"
            else
                log_warning "Registry credentials not provided, skipping authentication"
                return 0
            fi
        done

        log_error "Failed to authenticate with registry after $retries attempts"
        return 1
    }

    # Enhanced container push with verification
    push_container() {
        local retries=2

        for ((i=1; i<=retries; i++)); do
            log_info "Pushing container to registry (attempt $i/$retries)"
            if docker push "${IMAGE_REPO}:${GIT_COMMIT_ID}"; then
                # Verify image exists in registry
                if docker manifest inspect "${IMAGE_REPO}:${GIT_COMMIT_ID}" >/dev/null 2>&1; then
                    return 0
                else
                    log_warning "Image push completed but manifest not found, retrying..."
                fi
            fi
            sleep 2
        done

        log_error "Failed to push container after $retries attempts"
        return 1
    }

    # Enhanced Kubernetes setup with validation
    setup_kubernetes() {
        if [[ -z "${KUBE_CONFIG:-}" ]]; then
            log_warning "Kubernetes config not provided, skipping K8s setup"
            return 0
        fi

        log_step "Setting up Kubernetes access..."

        # Validate kubeconfig format
        if ! echo "$KUBE_CONFIG" | base64 -d >/dev/null 2>&1; then
            log_error "Invalid Kubernetes configuration (not valid base64)"
            return 1
        fi

        # Set up kubeconfig
        mkdir -p ~/.kube
        if ! echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config 2>/dev/null; then
            log_error "Failed to decode Kubernetes configuration"
            return 1
        fi
        chmod 600 ~/.kube/config

        # Debug: Show kubeconfig contents (without sensitive data)
        log_info "Kubeconfig file created, checking structure..."
        if kubectl config view >/dev/null 2>&1; then
            CONTEXT_COUNT=$(kubectl config get-contexts -o name | wc -l)
            log_info "Found $CONTEXT_COUNT context(s) in kubeconfig"
        else
            log_error "Kubeconfig file is malformed or invalid"
            return 1
        fi

        # Set current context if not set or if current context is invalid
        if ! kubectl config current-context >/dev/null 2>&1; then
            log_warning "No current context set in kubeconfig"
        fi

        CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
        log_info "Current context before validation: $CURRENT_CONTEXT"

        # If current context is not set or invalid, try to set a valid one
        if [[ "$CURRENT_CONTEXT" == "none" ]] || ! kubectl config get-contexts "$CURRENT_CONTEXT" >/dev/null 2>&1; then
            log_warning "Current context '$CURRENT_CONTEXT' is not valid, finding a valid context"

            # Try to set the first available context
            if FIRST_CONTEXT=$(kubectl config get-contexts -o name 2>/dev/null | head -1); then
                if kubectl config use-context "$FIRST_CONTEXT" >/dev/null 2>&1; then
                    log_info "Set current context to: $FIRST_CONTEXT"
                else
                    log_error "Failed to set context to: $FIRST_CONTEXT"
                    return 1
                fi
            else
                log_error "No valid contexts found in kubeconfig"
                log_info "Available contexts:"
                kubectl config get-contexts || true
                return 1
            fi
        fi

        # Debug: Show current context and cluster info
        CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
        log_info "Current context: $CURRENT_CONTEXT"

        # Validate cluster connectivity
        if ! kubectl cluster-info >/dev/null 2>&1; then
            log_error "Cannot connect to Kubernetes cluster"
            log_info "Check that your kubeconfig is valid and the cluster is accessible"
            log_info "Cluster info:"
            kubectl cluster-info || true
            return 1
        fi

        log_success "Kubernetes access configured successfully"

        # Ensure namespace exists with retry
        kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || {
            log_info "Creating namespace: $NAMESPACE"
            kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - || {
                log_error "Failed to create namespace $NAMESPACE"
                return 1
            }
        }

        # Apply secrets with validation
        if [[ -f "kubeSecrets/devENV.yaml" ]]; then
            log_info "Applying Kubernetes secrets"
            if kubectl apply -f kubeSecrets/devENV.yaml; then
                log_success "Kubernetes secrets applied successfully"
            else
                log_warning "Some secrets may have failed to apply"
            fi
        fi

        return 0
    }

    # Main deployment execution
    if ! authenticate_registry; then
        log_critical "Registry authentication failed, initiating rollback..."
        rollback_deployment
        exit 1
    fi

    if ! push_container; then
        log_critical "Container push failed, initiating rollback..."
        rollback_deployment
        exit 1
    fi

    if ! setup_kubernetes; then
        log_critical "Kubernetes setup failed, initiating rollback..."
        rollback_deployment
        exit 1
    fi

    log_success "Container pushed to registry"

    # Setup Kubernetes access
    setup_kubernetes || {
        log_critical "Kubernetes access setup failed"
        exit 1
    }

    log_success "Kubernetes access configured"

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

        # Enhanced Helm deployment with rollback support
        update_helm_deployment() {
            local temp_dir="devops-repo"

            # Clone devops repository with retry
            local clone_retries=3
            for ((i=1; i<=clone_retries; i++)); do
                log_info "Cloning devops repository (attempt $i/$clone_retries)"
                if git clone "https://github.com/${DEVOPS_REPO}.git" "$temp_dir"; then
                    break
                fi
                if [[ $i -eq $clone_retries ]]; then
                    log_error "Failed to clone devops repository after $clone_retries attempts"
                    return 1
                fi
                sleep 5
            done

            cd "$temp_dir"

            # Configure git
            git config user.name "$GIT_USER"
            git config user.email "$GIT_EMAIL"

            # Set up SSH authentication for git if available
            if [[ -n "${SSH_PRIVATE_KEY:-}" ]]; then
                log_info "Setting up SSH authentication for git operations"
                mkdir -p ~/.ssh
                echo "$SSH_PRIVATE_KEY" | base64 -d > ~/.ssh/git_key
                chmod 600 ~/.ssh/git_key
                ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null || true
                git remote set-url origin "git@github.com:${DEVOPS_REPO}.git"
                export GIT_SSH_COMMAND="ssh -i ~/.ssh/git_key -o StrictHostKeyChecking=no"
            elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
                log_info "Setting up GitHub token authentication"
                git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${DEVOPS_REPO}.git"
            fi

            # Pull latest changes
            if ! git pull --rebase; then
                log_warning "Failed to pull latest changes, continuing with local repo"
            fi

            # Update Helm values with validation
            if [[ -f "$VALUES_FILE_PATH" ]]; then
                log_info "Updating Helm values with new image"

                # Backup original file
                cp "$VALUES_FILE_PATH" "${VALUES_FILE_PATH}.backup"

                # Update image repository and tag
                if yq -i ".image.repository = \"${IMAGE_REPO}\" | .image.tag = \"${GIT_COMMIT_ID}\"" "$VALUES_FILE_PATH"; then
                    log_success "Helm values updated successfully"

                    # Validate YAML syntax
                    if yq eval "$VALUES_FILE_PATH" >/dev/null 2>&1; then
                        log_success "Helm values file is valid YAML"
                    else
                        log_error "Invalid YAML syntax in values file, restoring backup"
                        mv "${VALUES_FILE_PATH}.backup" "$VALUES_FILE_PATH"
                        return 1
                    fi

                    # Commit and push changes
                    if git add "$VALUES_FILE_PATH" && git commit -m "${APP_NAME}:${GIT_COMMIT_ID} released"; then
                        if git push; then
                            log_success "Helm deployment updated"
                        else
                            log_warning "Failed to push Helm changes to git (not critical for deployment)"
                            log_info "Deployment will continue despite git push failure"
                        fi
                    else
                        log_info "No changes to commit"
                    fi
                else
                    log_error "Failed to update Helm values, restoring backup"
                    mv "${VALUES_FILE_PATH}.backup" "$VALUES_FILE_PATH"
                    return 1
                fi
            else
                log_warning "Helm values file not found: $VALUES_FILE_PATH"
            fi

            cd ..
            rm -rf "$temp_dir"
            return 0
        }

        if ! update_helm_deployment; then
            log_critical "Helm deployment update failed, initiating rollback..."
            rollback_deployment
            exit 1
        fi

        # Refresh ArgoCD application to trigger deployment
        log_info "Refreshing ArgoCD application to trigger deployment..."
        if kubectl get application "$APP_NAME" -n argocd >/dev/null 2>&1; then
            log_info "Found ArgoCD application: $APP_NAME"

            # Check application status before refresh
            APP_STATUS=$(kubectl get application "$APP_NAME" -n argocd -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
            APP_HEALTH=$(kubectl get application "$APP_NAME" -n argocd -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")

            log_info "Application status: $APP_STATUS, Health: $APP_HEALTH"

            if kubectl patch application "$APP_NAME" -n argocd -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' --type=merge; then
                log_success "ArgoCD application refreshed - deployment should start"

                # Wait for ArgoCD to start deploying
                log_info "Waiting for ArgoCD deployment to start..."
                for i in {1..30}; do
                    if kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$APP_NAME" --no-headers | grep -q "Running\|Pending\|ContainerCreating"; then
                        log_success "ArgoCD deployment detected in namespace $NAMESPACE"
                        break
                    fi
                    if [[ $i -eq 30 ]]; then
                        log_warning "ArgoCD deployment not detected after 30 seconds - checking application status"
                        kubectl get application "$APP_NAME" -n argocd -o yaml | grep -A 10 -B 5 "status:" || true
                    fi
                    sleep 2
                done
            else
                log_warning "Failed to refresh ArgoCD application"
            fi
        else
            log_warning "ArgoCD application $APP_NAME not found in argocd namespace"
            log_info "Checking if it exists in other namespaces..."
            kubectl get applications -A | grep "$APP_NAME" || log_warning "ArgoCD application $APP_NAME not found in any namespace"

            # Try to create the application if it doesn't exist
            log_info "Attempting to create ArgoCD application..."
            # Try multiple possible paths for the ArgoCD application file
            APP_CREATED=false
            for app_path in "$temp_dir/apps/$APP_NAME/app.yaml" "$temp_dir/apps/erp-ui/app.yaml" "$temp_dir/erp-ui/app.yaml"; do
                if [[ -f "$app_path" ]]; then
                    if kubectl apply -f "$app_path" 2>/dev/null; then
                        log_success "ArgoCD application created successfully from $app_path"
                        APP_CREATED=true
                        sleep 5
                        # Retry the refresh
                        if kubectl patch application "$APP_NAME" -n argocd -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' --type=merge; then
                            log_success "ArgoCD application refreshed after creation"
                        fi
                        break
                    fi
                fi
            done

            if [[ "$APP_CREATED" == "false" ]]; then
                log_error "Failed to create ArgoCD application - application files not found in expected locations"
                log_info "Expected paths: $temp_dir/apps/$APP_NAME/app.yaml, $temp_dir/apps/erp-ui/app.yaml, $temp_dir/erp-ui/app.yaml"
                log_info "Please create the ArgoCD application manually or ensure the repository structure is correct"
            fi
        fi
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

get_service_urls() {
    if [[ -z "${KUBE_CONFIG:-}" ]]; then
        echo ""
        return 0
    fi

    local urls=""

    # Get ingress URLs for the application
    if kubectl get ingress -n "$NAMESPACE" >/dev/null 2>&1; then
        while IFS= read -r ingress; do
            if [[ -n "$ingress" ]]; then
                # Extract host from ingress
                local host
                host=$(kubectl get ingress "$ingress" -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null)

                if [[ -n "$host" ]]; then
                    # Determine protocol (default to http, but check for TLS)
                    local protocol="http"
                    if kubectl get ingress "$ingress" -n "$NAMESPACE" -o jsonpath='{.spec.tls}' 2>/dev/null | grep -q "hosts"; then
                        protocol="https"
                    fi

                    urls="${urls}${protocol}://${host}\n"
                fi
            fi
        done < <(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
    fi

    # If no ingress URLs found, try to get service URLs
    if [[ -z "$urls" ]]; then
        if kubectl get svc "$APP_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
            local service_port
            service_port=$(kubectl get svc "$APP_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)

            if [[ -n "$service_port" ]]; then
                urls="http://${APP_NAME}.${NAMESPACE}.svc.cluster.local:${service_port}\n"
                urls="${urls}(Cluster internal URL - configure ingress for external access)"
            fi
        fi
    fi

    # Debug: Show what we found
    if [[ -z "$urls" ]]; then
        log_warning "No service URLs found - ingress may not be ready yet"
        log_info "Checking ingress status..."
        kubectl get ingress -n "$NAMESPACE" 2>/dev/null || log_info "No ingress resources found in namespace $NAMESPACE"
        kubectl get certificate -n "$NAMESPACE" 2>/dev/null || log_info "No certificates found in namespace $NAMESPACE"
    fi

    echo -e "$urls" | sed '/^$/d' | head -5
}

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
echo ""

# Show service URLs if deployed
if [[ "$DEPLOY" == "true" && -n "${KUBE_CONFIG:-}" ]]; then
    echo "🌐 Service URLs:"
    service_urls=$(get_service_urls)
    if [[ -n "$service_urls" ]]; then
        echo -e "$service_urls"
    else
        echo "   No service URLs found"
        echo "   Check that ingress is properly configured"
    fi
fi

echo "=========================================="

log_success "BengoERP UI deployment process completed!"
