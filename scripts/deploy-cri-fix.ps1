#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Bedrock Cross-Region Inference (CRI) Fix

.DESCRIPTION
    This script builds and deploys the infrastructure changes to enable
    Cross-Region Inference for Amazon Bedrock, resolving AccessDenied
    and Throttling errors.

.PARAMETER Environment
    The environment to deploy to (dev, staging, prod). Default: dev

.PARAMETER SkipBuild
    Skip the build step and deploy existing build artifacts

.EXAMPLE
    .\scripts\deploy-cri-fix.ps1
    Deploy to dev environment with build

.EXAMPLE
    .\scripts\deploy-cri-fix.ps1 -Environment staging
    Deploy to staging environment

.EXAMPLE
    .\scripts\deploy-cri-fix.ps1 -SkipBuild
    Deploy without rebuilding (faster, use if build already exists)
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

# Set error action preference
$ErrorActionPreference = 'Stop'

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "=========================================="
Write-Info "Bedrock CRI Fix Deployment"
Write-Info "=========================================="
Write-Info "Environment: $Environment"
Write-Info "Skip Build: $SkipBuild"
Write-Info ""

# Check if SAM CLI is installed
try {
    $samVersion = sam --version
    Write-Success "✓ SAM CLI found: $samVersion"
} catch {
    Write-Error "✗ SAM CLI not found. Please install AWS SAM CLI first."
    Write-Info "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
}

# Check if AWS credentials are configured
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "✓ AWS credentials configured"
    Write-Info "  Account: $($awsIdentity.Account)"
    Write-Info "  User: $($awsIdentity.Arn)"
} catch {
    Write-Error "✗ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
}

# Verify template.yaml exists
if (-not (Test-Path "template.yaml")) {
    Write-Error "✗ template.yaml not found. Please run this script from the project root."
    exit 1
}

Write-Success "✓ Pre-flight checks passed"
Write-Info ""

# Build step
if (-not $SkipBuild) {
    Write-Info "=========================================="
    Write-Info "Building SAM Application"
    Write-Info "=========================================="
    Write-Info "This may take a few minutes..."
    Write-Info ""
    
    try {
        sam build
        Write-Success "✓ Build completed successfully"
        Write-Info ""
    } catch {
        Write-Error "✗ Build failed: $_"
        Write-Info ""
        Write-Warning "Troubleshooting tips:"
        Write-Info "1. Check that all dependencies are installed"
        Write-Info "2. Verify Node.js and Python are in your PATH"
        Write-Info "3. Try running 'sam build --use-container' if you have Docker"
        exit 1
    }
} else {
    Write-Warning "⚠ Skipping build step"
    
    # Verify build artifacts exist
    if (-not (Test-Path ".aws-sam/build/template.yaml")) {
        Write-Error "✗ No build artifacts found. Please run without -SkipBuild first."
        exit 1
    }
    
    Write-Success "✓ Using existing build artifacts"
    Write-Info ""
}

# Deploy step
Write-Info "=========================================="
Write-Info "Deploying to AWS"
Write-Info "=========================================="
Write-Info "Environment: $Environment"
Write-Info ""

try {
    Write-Info "Starting deployment..."
    sam deploy --no-confirm-changeset --parameter-overrides Environment=$Environment
    
    Write-Success ""
    Write-Success "=========================================="
    Write-Success "✓ Deployment Successful!"
    Write-Success "=========================================="
    Write-Info ""
    
    # Get stack outputs
    Write-Info "Fetching stack outputs..."
    $stackName = "experta-$Environment"
    $outputs = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json
    
    Write-Info ""
    Write-Info "Stack Outputs:"
    Write-Info "----------------------------------------"
    foreach ($output in $outputs) {
        Write-Info "$($output.OutputKey): $($output.OutputValue)"
    }
    
    Write-Info ""
    Write-Success "=========================================="
    Write-Success "Next Steps"
    Write-Success "=========================================="
    Write-Info "1. Test the chat endpoint to verify CRI is working"
    Write-Info "2. Monitor CloudWatch logs for any errors"
    Write-Info "3. Check CloudWatch metrics for Bedrock invocations"
    Write-Info ""
    Write-Info "To test the chat endpoint:"
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq 'ApiUrl' }).OutputValue
    Write-Info "  API URL: $apiUrl"
    Write-Info ""
    Write-Info "For detailed verification steps, see: BEDROCK_CRI_FIX.md"
    Write-Info ""
    
} catch {
    Write-Error ""
    Write-Error "=========================================="
    Write-Error "✗ Deployment Failed"
    Write-Error "=========================================="
    Write-Error "Error: $_"
    Write-Info ""
    Write-Warning "Troubleshooting tips:"
    Write-Info "1. Check AWS credentials have sufficient permissions"
    Write-Info "2. Verify the stack name doesn't conflict with existing stacks"
    Write-Info "3. Review CloudFormation events in AWS Console"
    Write-Info "4. Check samconfig.toml for correct configuration"
    Write-Info ""
    Write-Info "To view CloudFormation events:"
    Write-Info "  aws cloudformation describe-stack-events --stack-name experta-$Environment"
    exit 1
}

Write-Success "=========================================="
Write-Success "Deployment Complete!"
Write-Success "=========================================="
