# Add Admin User to Cognito
# Adds a user to the Admins group in Cognito User Pool

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

Write-Host "Adding admin user to Cognito..." -ForegroundColor Cyan
Write-Host ""

$userPoolId = "us-east-1_J12Z1OVxM"
$region = "us-east-1"

# Check if user exists
Write-Host "Checking if user exists..." -ForegroundColor Yellow
$userExists = $false

try {
    $user = aws cognito-idp admin-get-user --user-pool-id $userPoolId --username $Email --region $region 2>$null
    if ($LASTEXITCODE -eq 0) {
        $userExists = $true
        Write-Host "User found: $Email" -ForegroundColor Green
    }
} catch {
    Write-Host "User not found: $Email" -ForegroundColor Yellow
}

if (-not $userExists) {
    Write-Host ""
    Write-Host "User does not exist yet." -ForegroundColor Yellow
    Write-Host "The user needs to sign up first at:" -ForegroundColor Yellow
    Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/signup" -ForegroundColor White
    Write-Host ""
    Write-Host "After signup, run this script again." -ForegroundColor Yellow
    exit 1
}

# Add user to Admins group
Write-Host ""
Write-Host "Adding user to Admins group..." -ForegroundColor Yellow

aws cognito-idp admin-add-user-to-group `
    --user-pool-id $userPoolId `
    --username $Email `
    --group-name Admins `
    --region $region

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! User added to Admins group" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "   Email: $Email" -ForegroundColor White
    Write-Host "   Group: Admins" -ForegroundColor White
    Write-Host "   User Pool: $userPoolId" -ForegroundColor White
    Write-Host ""
    Write-Host "The user can now access the admin panel at:" -ForegroundColor Cyan
    Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: User may need to log out and log back in for changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "Failed to add user to Admins group" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "   - User does not exist (needs to sign up first)" -ForegroundColor White
    Write-Host "   - Admins group does not exist in Cognito" -ForegroundColor White
    Write-Host "   - AWS credentials not configured" -ForegroundColor White
    exit 1
}
