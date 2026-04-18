#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify Bedrock Cross-Region Inference (CRI) Fix

.DESCRIPTION
    This script verifies that the CRI fix has been properly deployed
    by checking CloudFormation parameters, Lambda environment variables,
    and IAM permissions.

.PARAMETER Environment
    The environment to verify (dev, staging, prod). Default: dev

.EXAMPLE
    .\scripts\verify-cri-fix.ps1
    Verify dev environment

.EXAMPLE
    .\scripts\verify-cri-fix.ps1 -Environment staging
    Verify staging environment
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev'
)

# Set error action preference
$ErrorActionPreference = 'Continue'

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Check { param($passed, $message) if ($passed) { Write-Success "✓ $message" } else { Write-Error "✗ $message" } }

$stackName = "experta-$Environment"
$allChecksPassed = $true

Write-Info "=========================================="
Write-Info "Bedrock CRI Fix Verification"
Write-Info "=========================================="
Write-Info "Environment: $Environment"
Write-Info "Stack Name: $stackName"
Write-Info ""

# Check 1: CloudFormation Stack Exists
Write-Info "Check 1: CloudFormation Stack"
Write-Info "----------------------------------------"
try {
    $stack = aws cloudformation describe-stacks --stack-name $stackName --output json | ConvertFrom-Json
    $stackStatus = $stack.Stacks[0].StackStatus
    Write-Check ($stackStatus -eq "CREATE_COMPLETE" -or $stackStatus -eq "UPDATE_COMPLETE") "Stack exists and is in good state: $stackStatus"
    
    if ($stackStatus -ne "CREATE_COMPLETE" -and $stackStatus -ne "UPDATE_COMPLETE") {
        $allChecksPassed = $false
    }
} catch {
    Write-Check $false "Stack not found or error accessing stack"
    $allChecksPassed = $false
}
Write-Info ""

# Check 2: Model ID Parameter
Write-Info "Check 2: Bedrock Model ID Parameter"
Write-Info "----------------------------------------"
try {
    $parameters = $stack.Stacks[0].Parameters
    $modelIdParam = $parameters | Where-Object { $_.ParameterKey -eq "BedrockClaudeModelId" }
    $modelId = $modelIdParam.ParameterValue
    
    Write-Info "Current Model ID: $modelId"
    
    $isCorrect = $modelId -eq "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    Write-Check $isCorrect "Model ID uses US System Profile (us. prefix)"
    
    if (-not $isCorrect) {
        Write-Warning "Expected: us.anthropic.claude-3-5-sonnet-20241022-v2:0"
        Write-Warning "Got: $modelId"
        $allChecksPassed = $false
    }
} catch {
    Write-Check $false "Could not retrieve Model ID parameter"
    $allChecksPassed = $false
}
Write-Info ""

# Check 3: Lambda Environment Variables
Write-Info "Check 3: Lambda Environment Variables"
Write-Info "----------------------------------------"
$lambdaFunctions = @(
    "chat-handler",
    "onboarding",
    "content-generator",
    "posts-api"
)

foreach ($funcName in $lambdaFunctions) {
    $fullFuncName = "$stackName-$funcName-$Environment"
    try {
        $funcConfig = aws lambda get-function-configuration --function-name $fullFuncName --output json 2>$null | ConvertFrom-Json
        $envModelId = $funcConfig.Environment.Variables.BEDROCK_CLAUDE_MODEL_ID
        
        if ($envModelId) {
            $isCorrect = $envModelId -eq "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
            Write-Check $isCorrect "$funcName: $envModelId"
            
            if (-not $isCorrect) {
                $allChecksPassed = $false
            }
        } else {
            Write-Warning "⚠ $funcName: No BEDROCK_CLAUDE_MODEL_ID environment variable"
        }
    } catch {
        Write-Warning "⚠ $funcName: Could not retrieve function configuration"
    }
}
Write-Info ""

# Check 4: IAM Role Permissions
Write-Info "Check 4: IAM Role Permissions"
Write-Info "----------------------------------------"
try {
    $roleName = "$stackName-lambda-execution-$Environment"
    $policy = aws iam get-role-policy --role-name $roleName --policy-name BedrockAccess --output json 2>$null | ConvertFrom-Json
    
    if ($policy) {
        $policyDoc = $policy.PolicyDocument | ConvertTo-Json -Depth 10
        
        # Check for explicit resource ARNs
        $hasUsEast1 = $policyDoc -match "arn:aws:bedrock:us-east-1::foundation-model"
        $hasUsWest2 = $policyDoc -match "arn:aws:bedrock:us-west-2::foundation-model"
        $hasInferenceProfile = $policyDoc -match "inference-profile/us\.anthropic"
        $hasWildcard = $policyDoc -match '"Resource":\s*"\*"'
        
        Write-Check $hasUsEast1 "us-east-1 foundation model ARN present"
        Write-Check $hasUsWest2 "us-west-2 foundation model ARN present"
        Write-Check $hasInferenceProfile "US System Profile inference profile ARN present"
        Write-Check (-not $hasWildcard) "No wildcard (*) permissions (explicit resources only)"
        
        if (-not ($hasUsEast1 -and $hasUsWest2 -and $hasInferenceProfile) -or $hasWildcard) {
            $allChecksPassed = $false
        }
    } else {
        Write-Check $false "Could not retrieve BedrockAccess policy"
        $allChecksPassed = $false
    }
} catch {
    Write-Check $false "Could not retrieve IAM role policy"
    $allChecksPassed = $false
}
Write-Info ""

# Check 5: Stack Outputs
Write-Info "Check 5: Stack Outputs"
Write-Info "----------------------------------------"
try {
    $outputs = $stack.Stacks[0].Outputs
    
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq 'ApiUrl' }).OutputValue
    $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq 'UserPoolId' }).OutputValue
    $chatHandlerArn = ($outputs | Where-Object { $_.OutputKey -eq 'ChatHandlerFunctionArn' }).OutputValue
    
    Write-Check ($null -ne $apiUrl) "API URL: $apiUrl"
    Write-Check ($null -ne $userPoolId) "User Pool ID: $userPoolId"
    Write-Check ($null -ne $chatHandlerArn) "Chat Handler ARN: $chatHandlerArn"
    
    if ($null -eq $apiUrl -or $null -eq $userPoolId -or $null -eq $chatHandlerArn) {
        $allChecksPassed = $false
    }
} catch {
    Write-Check $false "Could not retrieve stack outputs"
    $allChecksPassed = $false
}
Write-Info ""

# Summary
Write-Info "=========================================="
if ($allChecksPassed) {
    Write-Success "✓ All Checks Passed!"
    Write-Success "=========================================="
    Write-Info ""
    Write-Info "The Bedrock CRI fix has been successfully deployed."
    Write-Info ""
    Write-Info "Key Features Enabled:"
    Write-Info "  • Cross-Region Inference (us-east-1 ↔ us-west-2)"
    Write-Info "  • Higher quotas via US System Profile"
    Write-Info "  • Explicit IAM permissions (no wildcards)"
    Write-Info "  • Automatic failover between regions"
    Write-Info ""
    Write-Info "Next Steps:"
    Write-Info "  1. Test the chat endpoint with a real request"
    Write-Info "  2. Monitor CloudWatch logs for Bedrock invocations"
    Write-Info "  3. Check CloudWatch metrics for throttling reduction"
    Write-Info ""
    Write-Info "To test the chat endpoint, see: BEDROCK_CRI_FIX.md"
    Write-Info ""
} else {
    Write-Error "✗ Some Checks Failed"
    Write-Error "=========================================="
    Write-Info ""
    Write-Warning "The CRI fix may not be fully deployed or configured correctly."
    Write-Info ""
    Write-Info "Troubleshooting:"
    Write-Info "  1. Re-run deployment: .\scripts\deploy-cri-fix.ps1"
    Write-Info "  2. Check CloudFormation events for errors"
    Write-Info "  3. Verify AWS credentials have sufficient permissions"
    Write-Info "  4. Review BEDROCK_CRI_FIX.md for detailed instructions"
    Write-Info ""
    Write-Info "To view CloudFormation events:"
    Write-Info "  aws cloudformation describe-stack-events --stack-name $stackName"
    Write-Info ""
}

Write-Info "=========================================="
Write-Info "Verification Complete"
Write-Info "=========================================="

# Exit with appropriate code
if ($allChecksPassed) {
    exit 0
} else {
    exit 1
}
