# Create Admin User in Cognito
# Creates a new user and adds them to the Admins group

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$TempPassword = "TempPass123!"
)

Write-Host "Creating admin user in Cognito..." -ForegroundColor Cyan
Write-Host ""

$userPoolId = "us-east-1_J12Z1OVxM"
$region = "us-east-1"

# Check if user already exists
Write-Host "Checking if user exists..." -ForegroundColor Yellow
$userExists = $false

try {
    $user = aws cognito-idp admin-get-user --user-pool-id $userPoolId --username $Email --region $region 2>$null
    if ($LASTEXITCODE -eq 0) {
        $userExists = $true
        Write-Host "User already exists: $Email" -ForegroundColor Green
    }
} catch {
    Write-Host "User not found, will create new user" -ForegroundColor Yellow
}

# Create user if doesn't exist
if (-not $userExists) {
    Write-Host ""
    Write-Host "Creating user..." -ForegroundColor Yellow
    
    aws cognito-idp admin-create-user `
        --user-pool-id $userPoolId `
        --username $Email `
        --user-attributes Name=email,Value=$Email Name=email_verified,Value=true `
        --temporary-password $TempPassword `
        --message-action SUPPRESS `
        --region $region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create user" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "User created successfully!" -ForegroundColor Green
    
    # Set permanent password
    Write-Host "Setting permanent password..." -ForegroundColor Yellow
    
    aws cognito-idp admin-set-user-password `
        --user-pool-id $userPoolId `
        --username $Email `
        --password $TempPassword `
        --permanent `
        --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Password set successfully!" -ForegroundColor Green
    }
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
    Write-Host ""
    Write-Host "SUCCESS! Admin user configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Email: $Email" -ForegroundColor White
    Write-Host "   Password: $TempPassword" -ForegroundColor White
    Write-Host "   Group: Admins" -ForegroundColor White
    Write-Host ""
    Write-Host "Login URL:" -ForegroundColor Cyan
    Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/login" -ForegroundColor White
    Write-Host ""
    Write-Host "Admin Panel:" -ForegroundColor Cyan
    Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/admin" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: Change your password after first login!" -ForegroundColor Yellow
} else {
    Write-Host "Failed to add user to Admins group" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking if Admins group exists..." -ForegroundColor Yellow
    
    $groups = aws cognito-idp list-groups --user-pool-id $userPoolId --region $region --query "Groups[?GroupName=='Admins']" --output text
    
    if ([string]::IsNullOrWhiteSpace($groups)) {
        Write-Host "Admins group does not exist! Creating it..." -ForegroundColor Yellow
        
        aws cognito-idp create-group `
            --user-pool-id $userPoolId `
            --group-name Admins `
            --description "System administrators with full access" `
            --region $region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Admins group created! Retrying user addition..." -ForegroundColor Green
            
            aws cognito-idp admin-add-user-to-group `
                --user-pool-id $userPoolId `
                --username $Email `
                --group-name Admins `
                --region $region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "SUCCESS! Admin user configured" -ForegroundColor Green
                Write-Host ""
                Write-Host "Login Credentials:" -ForegroundColor Cyan
                Write-Host "   Email: $Email" -ForegroundColor White
                Write-Host "   Password: $TempPassword" -ForegroundColor White
                Write-Host "   Group: Admins" -ForegroundColor White
                Write-Host ""
                Write-Host "Login URL:" -ForegroundColor Cyan
                Write-Host "   http://experta-frontend-dev.s3-website-us-east-1.amazonaws.com/login" -ForegroundColor White
            }
        }
    }
}
