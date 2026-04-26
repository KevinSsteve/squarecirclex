# Asset Organization Script for 3D Visual Upgrade
param(
    [string]$SourcePath = "downloads",
    [string]$TargetPath = "frontend\public\assets\sprites",
    [switch]$DryRun = $false
)

Write-Host "`n=== Asset Organization Script ===" -ForegroundColor Cyan
Write-Host "Source: $SourcePath" -ForegroundColor Gray
Write-Host "Target: $TargetPath" -ForegroundColor Gray
if ($DryRun) {
    Write-Host "Mode: DRY RUN (no files will be moved)" -ForegroundColor Yellow
} else {
    Write-Host "Mode: LIVE (files will be moved)" -ForegroundColor Green
}
Write-Host ""

# Asset categorization rules
$categories = @{
    'furniture' = @('desk', 'chair', 'table', 'shelf', 'cabinet', 'bookcase', 'storage', 'furniture')
    'decorations' = @('plant', 'poster', 'art', 'decoration', 'whiteboard', 'board', 'clock', 'calendar', 'mug', 'lamp')
    'characters' = @('character', 'agent', 'person', 'people', 'idle', 'walk', 'work', 'celebrate', 'animation')
    'environment' = @('floor', 'wall', 'carpet', 'tile', 'window', 'door', 'environment', 'ground')
    'shadows' = @('shadow', 'shade')
}

# Statistics
$stats = @{
    total = 0
    moved = 0
    skipped = 0
    byCategory = @{}
}

foreach ($cat in $categories.Keys) {
    $stats.byCategory[$cat] = 0
}

# Create target directories if not in dry run mode
if (-not $DryRun) {
    foreach ($cat in $categories.Keys) {
        $targetDir = Join-Path $TargetPath $cat
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            Write-Host "[CREATED] Directory: $cat" -ForegroundColor Green
        }
    }
}

# Process files
Write-Host "`n[PROCESSING] Scanning files..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $SourcePath -Recurse -File -Include *.png,*.jpg,*.jpeg

foreach ($file in $files) {
    $stats.total++
    $fileName = $file.Name.ToLower()
    $matched = $false
    
    # Try to match file to a category
    foreach ($cat in $categories.Keys) {
        foreach ($keyword in $categories[$cat]) {
            if ($fileName -like "*$keyword*") {
                $targetDir = Join-Path $TargetPath $cat
                $targetFile = Join-Path $targetDir $file.Name
                
                if ($DryRun) {
                    Write-Host "[DRY RUN] Would move: $($file.Name) -> $cat/" -ForegroundColor Yellow
                } else {
                    Copy-Item -Path $file.FullName -Destination $targetFile -Force
                    Write-Host "[MOVED] $($file.Name) -> $cat/" -ForegroundColor Green
                }
                
                $stats.moved++
                $stats.byCategory[$cat]++
                $matched = $true
                break
            }
        }
        if ($matched) { break }
    }
    
    if (-not $matched) {
        Write-Host "[SKIPPED] $($file.Name) (no category match)" -ForegroundColor Gray
        $stats.skipped++
    }
}

# Print statistics
Write-Host "`n=== Statistics ===" -ForegroundColor Cyan
Write-Host "Total files found: $($stats.total)" -ForegroundColor White
Write-Host "Files moved: $($stats.moved)" -ForegroundColor Green
Write-Host "Files skipped: $($stats.skipped)" -ForegroundColor Yellow
Write-Host ""
Write-Host "By category:" -ForegroundColor White
foreach ($cat in $categories.Keys) {
    $count = $stats.byCategory[$cat]
    if ($count -gt 0) {
        Write-Host "  $cat : $count files" -ForegroundColor Cyan
    }
}

Write-Host ""
if ($DryRun) {
    Write-Host "[INFO] Dry run complete. Run without -DryRun to actually copy files." -ForegroundColor Yellow
} else {
    Write-Host "[SUCCESS] Asset organization complete!" -ForegroundColor Green
}
Write-Host ""
