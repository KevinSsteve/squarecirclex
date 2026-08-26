#!/bin/bash
# =============================================================================
# 🚀 Deploy Script: Generative AI Application Builder on AWS
# =============================================================================
# This script automates the deployment of the AWS GenAI App Builder solution
# configured with premium AI models, all paid by AWS Activate credits.
#
# Models configured:
#   - Claude Opus 5 (text/chat - best available)
#   - Claude Sonnet 5 (fast tasks)
#   - Stable Image Ultra v1.1 (premium image generation)
#
# Usage:
#   ./scripts/deploy-genai-builder.sh --email your@email.com [--region us-east-1] [--vpc]
#
# Prerequisites:
#   - AWS CLI configured with valid credentials
#   - Node.js 20.x, Python 3.13.x, Docker installed
#   - AWS CDK v2 installed (npm install -g aws-cdk)
#   - Bedrock model access enabled for: Claude Opus 5, Sonnet 5, Stable Image Ultra
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
REGION="us-east-1"
VPC_ENABLED="No"
CREATE_VPC="No"
ADMIN_EMAIL=""
SKIP_BOOTSTRAP=false
SKIP_STAGE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --vpc)
            VPC_ENABLED="Yes"
            CREATE_VPC="Yes"
            shift
            ;;
        --skip-bootstrap)
            SKIP_BOOTSTRAP=true
            shift
            ;;
        --skip-stage)
            SKIP_STAGE=true
            shift
            ;;
        --help|-h)
            echo ""
            echo "Usage: $0 --email <admin-email> [options]"
            echo ""
            echo "Options:"
            echo "  --email <email>      Admin email for Cognito login (REQUIRED)"
            echo "  --region <region>    AWS region (default: us-east-1)"
            echo "  --vpc               Enable VPC deployment (recommended for production)"
            echo "  --skip-bootstrap    Skip CDK bootstrap step"
            echo "  --skip-stage        Skip asset staging step"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 --email admin@mycompany.com --region us-east-1 --vpc"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$ADMIN_EMAIL" ]]; then
    echo -e "${RED}❌ Error: --email is required${NC}"
    echo "Usage: $0 --email your@email.com [--region us-east-1] [--vpc]"
    exit 1
fi

# =============================================================================
# Helper functions
# =============================================================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   🚀 Generative AI Application Builder - Premium Deploy        ║${NC}"
    echo -e "${CYAN}║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║${NC}"
    echo -e "${CYAN}║   Models: Claude Opus 5 + Stable Image Ultra v1.1              ║${NC}"
    echo -e "${CYAN}║   Credits: AWS Activate (100% covered)                         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}▶ Step $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ $1 found${NC}"
}

# =============================================================================
# Main deployment flow
# =============================================================================

print_banner

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Admin Email:  ${CYAN}$ADMIN_EMAIL${NC}"
echo -e "  Region:       ${CYAN}$REGION${NC}"
echo -e "  VPC Enabled:  ${CYAN}$VPC_ENABLED${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
print_step "1/7" "Checking prerequisites"
# ─────────────────────────────────────────────────────────────────────────────

check_command "aws"
check_command "node"
check_command "python3"
check_command "docker"
check_command "cdk"
check_command "jq"

# Verify AWS credentials
echo -e "\n  Checking AWS credentials..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    echo -e "${RED}❌ AWS credentials not configured or expired.${NC}"
    echo "   Run: aws configure"
    exit 1
fi
echo -e "${GREEN}  ✓ AWS Account: $AWS_ACCOUNT_ID${NC}"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 20 ]]; then
    echo -e "${RED}❌ Node.js 20+ required (found: $(node --version))${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node --version)${NC}"

# Check Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Docker is running${NC}"

# ─────────────────────────────────────────────────────────────────────────────
print_step "2/7" "Checking Bedrock model access"
# ─────────────────────────────────────────────────────────────────────────────

echo "  Verifying model access in region $REGION..."

# Check Claude Opus 5 access
OPUS_ACCESS=$(aws bedrock get-foundation-model \
    --model-identifier "anthropic.claude-opus-5" \
    --region "$REGION" \
    --query "modelDetails.modelLifecycle.status" \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [[ "$OPUS_ACCESS" == "ACTIVE" ]]; then
    echo -e "${GREEN}  ✓ Claude Opus 5: Available${NC}"
else
    echo -e "${YELLOW}  ⚠ Claude Opus 5: Not verified (may need model access request)${NC}"
    echo -e "${YELLOW}    → Go to Bedrock Console → Model access → Request access${NC}"
fi

# Check Stable Image Ultra access
ULTRA_ACCESS=$(aws bedrock get-foundation-model \
    --model-identifier "stability.stable-image-ultra-v1:0" \
    --region "$REGION" \
    --query "modelDetails.modelLifecycle.status" \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [[ "$ULTRA_ACCESS" == "ACTIVE" ]]; then
    echo -e "${GREEN}  ✓ Stable Image Ultra v1.1: Available${NC}"
else
    echo -e "${YELLOW}  ⚠ Stable Image Ultra: Not verified (may need model access request)${NC}"
fi

echo -e "\n${YELLOW}  Note: Ensure all models are enabled in Bedrock console before using.${NC}"

# ─────────────────────────────────────────────────────────────────────────────
print_step "3/7" "Cloning GAAB repository"
# ─────────────────────────────────────────────────────────────────────────────

GAAB_DIR="$(pwd)/gaab"

if [[ -d "$GAAB_DIR" ]]; then
    echo -e "${YELLOW}  GAAB directory already exists, pulling latest...${NC}"
    cd "$GAAB_DIR" && git pull origin main && cd -
else
    echo "  Cloning aws-solutions/generative-ai-application-builder-on-aws..."
    git clone https://github.com/aws-solutions/generative-ai-application-builder-on-aws.git "$GAAB_DIR"
fi

echo -e "${GREEN}  ✓ Repository ready${NC}"

# ─────────────────────────────────────────────────────────────────────────────
print_step "4/7" "CDK Bootstrap"
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$SKIP_BOOTSTRAP" == true ]]; then
    echo -e "${YELLOW}  Skipping bootstrap (--skip-bootstrap flag)${NC}"
else
    echo "  Bootstrapping CDK in $REGION..."
    cdk bootstrap "aws://$AWS_ACCOUNT_ID/$REGION"
    echo -e "${GREEN}  ✓ CDK bootstrapped${NC}"
fi

# ─────────────────────────────────────────────────────────────────────────────
print_step "5/7" "Installing dependencies and building"
# ─────────────────────────────────────────────────────────────────────────────

cd "$GAAB_DIR/source/infrastructure"

echo "  Installing npm dependencies..."
npm install

echo "  Building TypeScript..."
npm run build

echo "  Synthesizing CloudFormation templates..."
cdk synth

echo -e "${GREEN}  ✓ Build complete${NC}"

# ─────────────────────────────────────────────────────────────────────────────
print_step "6/7" "Deploying Deployment Dashboard"
# ─────────────────────────────────────────────────────────────────────────────

echo "  Deploying DeploymentPlatformStack..."
echo -e "${YELLOW}  This may take 10-15 minutes...${NC}"

DEPLOY_PARAMS="--parameters AdminUserEmail=$ADMIN_EMAIL"

if [[ "$VPC_ENABLED" == "Yes" ]]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS --parameters VpcEnabled=$VPC_ENABLED --parameters CreateNewVpc=$CREATE_VPC"
fi

cdk deploy DeploymentPlatformStack \
    $DEPLOY_PARAMS \
    --require-approval never \
    --region "$REGION"

echo -e "${GREEN}  ✓ Dashboard deployed!${NC}"

# ─────────────────────────────────────────────────────────────────────────────
print_step "7/7" "Staging assets for use case deployments"
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$SKIP_STAGE" == true ]]; then
    echo -e "${YELLOW}  Skipping asset staging (--skip-stage flag)${NC}"
else
    cd "$GAAB_DIR/source"
    echo "$REGION" | ./stage-assets.sh
    echo -e "${GREEN}  ✓ Assets staged${NC}"
fi

# =============================================================================
# Deployment Complete
# =============================================================================

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}║   ✅ DEPLOYMENT COMPLETE!                                        ║${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}What was deployed:${NC}"
echo -e "  • Deployment Dashboard (Admin UI)"
echo -e "  • CloudFront CDN + S3 hosting"
echo -e "  • API Gateway + Lambda backend"
echo -e "  • Cognito authentication"
echo -e "  • DynamoDB for configurations"
echo -e "  • CloudWatch monitoring"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Check your email (${CYAN}$ADMIN_EMAIL${NC}) for login credentials"
echo -e "  2. Access the Dashboard URL from CloudFormation outputs"
echo -e "  3. Create a new Text use case with these settings:"
echo -e "     ${CYAN}• Model Provider: Bedrock${NC}"
echo -e "     ${CYAN}• Inference Type: Inference Profiles${NC}"
echo -e "     ${CYAN}• Profile ID: global.anthropic.claude-opus-5${NC}"
echo -e "     ${CYAN}• Temperature: 0.7${NC}"
echo -e "     ${CYAN}• Streaming: Enabled${NC}"
echo ""
echo -e "${GREEN}Get Dashboard URL:${NC}"
echo -e "  aws cloudformation describe-stacks \\"
echo -e "    --stack-name DeploymentPlatformStack \\"
echo -e "    --region $REGION \\"
echo -e "    --query 'Stacks[0].Outputs' \\"
echo -e "    --output table"
echo ""
echo -e "${YELLOW}💰 All costs are covered by your AWS Activate credits!${NC}"
echo ""
