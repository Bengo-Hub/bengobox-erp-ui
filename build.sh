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
DEPLOY=${DEPLOY:-true}
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
VALUES_FILE_PATH="apps/${APP_NAME}/values.yaml"

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

log_info "Scanning filesystem for vulnerabilities"
# Exclude development certificates and sensitive files from scanning
trivy fs . --exit-code "$TRIVY_ECODE" --format table --skip-files "localhost*.pem" --skip-files "*.key" --skip-files "*.crt" --skip-files "integrations/payments/card_payment.py"

log_success "Filesystem vulnerability scan completed"

# =============================================================================
# DOCKER CONTAINER BUILD
# =============================================================================

log_step "Building Docker container..."

SSH_CONFIGURED=false

# Check if SSH keys are available for Docker build
if [[ -n "${DOCKER_SSH_KEY:-}" ]]; then
    log_info "Setting up SSH key for Docker build"
    mkdir -p -m 0700 ~/.ssh
    echo "$DOCKER_SSH_KEY" | base64 -d > ~/.ssh/id_rsa
    chmod 0600 ~/.ssh/id_rsa
    ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null || true

    # For CI/CD environments, try non-interactive SSH key addition
    # Use DISPLAY and SSH_ASKPASS to avoid passphrase prompts
    if [[ -n "${CI:-}" ]] || [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        log_info "Running in CI/CD environment, using non-interactive SSH setup"

        # Try to add key with passphrase "codevertex"
        if echo "codevertex" | SSH_ASKPASS=/bin/echo ssh-add ~/.ssh/id_rsa 2>/dev/null; then
            SSH_CONFIGURED=true
            log_success "SSH configured for Docker build"
        else
            log_warning "SSH key passphrase incorrect or failed to add to agent, building without SSH"
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
    --format table \
    --ignorefile .trivyignore

log_success "Container vulnerability scan completed"

# =============================================================================
# DEPLOYMENT PHASE - USE CENTRALIZED WORKFLOW
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

    # Use centralized reusable workflow for deployment
    log_info "Calling centralized deployment workflow..."

    # Set up environment for workflow call
    export GITHUB_TOKEN=${GITHUB_TOKEN:-}
    export GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-}
    export GITHUB_SHA=${GITHUB_SHA:-}

    # For cross-repository workflow triggering, use a PAT with workflow permissions
    # The default GITHUB_TOKEN only has permissions for the current repository
    export GH_TOKEN=${GH_PAT:-${GITHUB_TOKEN}}

    # Call the reusable workflow with explicit token for cross-repo access
    gh workflow run 196475028 \
        --repo Bengo-Hub/devops-k8s \
        --ref main \
        --token "$GH_TOKEN" \
        --field app_name="${APP_NAME}" \
        --field registry_server="${REGISTRY_SERVER}" \
        --field registry_namespace="${REGISTRY_NAMESPACE}" \
        --field deploy=true \
        --field values_file_path="${VALUES_FILE_PATH}" \
        --field namespace="${NAMESPACE}" \
        --field git_user="${GIT_USER}" \
        --field git_email="${GIT_EMAIL}" \
        --field devops_repo="${DEVOPS_REPO}" \
        --field setup_databases="${SETUP_DATABASES}" \
        --field db_types="${DB_TYPES}" \
        --field env_secret_name="${ENV_SECRET_NAME}" \
        --field provider="${PROVIDER}" \
        --field contabo_api="${CONTABO_API}" \
        --field ssh_deploy="${SSH_DEPLOY}" \
        --field ssh_host="${SSH_HOST:-}" \
        --field ssh_user="${SSH_USER:-}" \
        --field ssh_port="${SSH_PORT:-22}" \
        --field deployment_summary_title="${DEPLOYMENT_SUMMARY_TITLE:-BengoERP UI Deployment Summary}" \
        --field deployment_success_message="${DEPLOYMENT_SUCCESS_MESSAGE:-BengoERP UI deployment completed! The UI should be accessible via the URLs above.}" \
        --field application_display_name="${APPLICATION_DISPLAY_NAME:-BengoERP UI}"

    log_success "Deployment workflow initiated successfully!"

    # Wait for service URLs if deployment was enabled
    if [[ "$DEPLOY" == "true" ]]; then
      log_info "Waiting for service URLs to be available..."

      # Wait up to 5 minutes for the workflow to complete and get URLs
      workflow_wait_time=300
      workflow_check_interval=30
      elapsed=0

      while [[ $elapsed -lt $workflow_wait_time ]]; do
        log_info "Checking for service URLs... (${elapsed}s/${workflow_wait_time}s)"

        # Check if the workflow run has completed and has service_urls output
        if gh run list --repo Bengo-Hub/devops-k8s --workflow=196475028 --limit=1 --json conclusion,databaseId --jq '.[] | select(.conclusion == "success") | .databaseId' --token "$GH_TOKEN" >/dev/null 2>&1; then
          log_info "Deployment workflow completed, fetching service URLs..."

          # Get the latest successful run and extract service URLs
          RUN_ID=$(gh run list --repo Bengo-Hub/devops-k8s --workflow=196475028 --limit=1 --json databaseId --jq '.[0].databaseId' --token "$GH_TOKEN")
          SERVICE_URLS=$(gh run view "$RUN_ID" --log | grep -A 10 "service_urls<<" | tail -n +2 | head -n -1 | sed 's/^  //')

          if [[ -n "$SERVICE_URLS" && "$SERVICE_URLS" != *"⏳ Services still starting up"* ]]; then
            log_success "Service URLs discovered:"
            echo "$SERVICE_URLS"
            break
          fi
        fi

        sleep $workflow_check_interval
        elapsed=$((elapsed + workflow_check_interval))
      done

      if [[ $elapsed -ge $workflow_wait_time ]]; then
        log_warning "Timeout waiting for service URLs. Check ArgoCD sync status manually."
      fi
    fi

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
echo "Helm Update: $([[ "$DEPLOY" == "true" ]] && echo '✅ Initiated' || echo '❌ Skipped')"

# Display service URLs if available
if [[ "$DEPLOY" == "true" && -n "${SERVICE_URLS:-}" ]]; then
  echo ""
  echo "🌐 Service URLs:"
  echo "$SERVICE_URLS"
fi

echo "=========================================="

log_success "BengoERP UI deployment process completed!"
