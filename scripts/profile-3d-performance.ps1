# Performance Profiling Script for 3D Visual Upgrade
# Task 5.1: Performance Profiling
# 
# This script helps profile the game's 3D visual performance
# by running automated tests with varying agent counts and
# collecting performance metrics.

param(
    [switch]$AutoRun,
    [int]$MaxAgents = 20,
    [int]$DurationSeconds = 30
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3D Visual Upgrade - Performance Profiler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
Write-Host "Checking if development server is running..." -ForegroundColor Yellow
$devServerRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
    $devServerRunning = $true
    Write-Host "✓ Development server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Development server is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the development server first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Performance Profiling Configuration:" -ForegroundColor Cyan
Write-Host "  Max Agents: $MaxAgents" -ForegroundColor White
Write-Host "  Duration per test: $DurationSeconds seconds" -ForegroundColor White
Write-Host ""

if (-not $AutoRun) {
    Write-Host "This script will guide you through performance profiling." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open the game in your browser (http://localhost:5173/app)" -ForegroundColor White
    Write-Host "  2. Enable Dev Mode (localStorage: devMode = true)" -ForegroundColor White
    Write-Host "  3. Press 'D' key to toggle Performance Monitor overlay" -ForegroundColor White
    Write-Host "  4. Test with different agent counts (1, 5, 10, 15, 20)" -ForegroundColor White
    Write-Host "  5. Record metrics from the overlay" -ForegroundColor White
    Write-Host ""
    Write-Host "Performance Monitor Keyboard Shortcuts:" -ForegroundColor Cyan
    Write-Host "  D         - Toggle performance overlay" -ForegroundColor White
    Write-Host "  Q         - Toggle auto-quality adjustment" -ForegroundColor White
    Write-Host "  Ctrl+1    - Set quality to HIGH" -ForegroundColor White
    Write-Host "  Ctrl+2    - Set quality to MEDIUM" -ForegroundColor White
    Write-Host "  Ctrl+3    - Set quality to LOW" -ForegroundColor White
    Write-Host "  Ctrl+4    - Set quality to PERFORMANCE" -ForegroundColor White
    Write-Host ""
}

# Create results directory
$resultsDir = "performance-results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$resultsFile = "$resultsDir/profile_$timestamp.md"

Write-Host "Creating performance profile template..." -ForegroundColor Yellow

# Create performance profile template
$template = @"
# 3D Visual Upgrade - Performance Profile
**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Duration**: $DurationSeconds seconds per test
**Browser**: [Record browser name and version]
**System**: [Record CPU, GPU, RAM]

---

## Test Configuration

- **Resolution**: 1920×1080 (record actual resolution)
- **Quality Level**: HIGH (test all levels)
- **3D Features Enabled**:
  - ✓ Isometric sprites
  - ✓ Shadow system
  - ✓ Lighting effects
  - ✓ Particle effects
  - ✓ Character animations
  - ✓ Department decorations

---

## Performance Metrics by Agent Count

### Test 1: 1 Agent (Baseline)

| Metric | Value | Status |
|--------|-------|--------|
| **FPS** | ___ | ⚪ |
| **Entity Count** | ___ | ⚪ |
| **Draw Calls** | ___ | ⚪ |
| **Memory Usage** | ___ MB | ⚪ |
| **Update Time** | ___ ms | ⚪ |
| **Render Time** | ___ ms | ⚪ |

**Notes**: 


---

### Test 2: 5 Agents

| Metric | Value | Status |
|--------|-------|--------|
| **FPS** | ___ | ⚪ |
| **Entity Count** | ___ | ⚪ |
| **Draw Calls** | ___ | ⚪ |
| **Memory Usage** | ___ MB | ⚪ |
| **Update Time** | ___ ms | ⚪ |
| **Render Time** | ___ ms | ⚪ |

**Notes**: 


---

### Test 3: 10 Agents

| Metric | Value | Status |
|--------|-------|--------|
| **FPS** | ___ | ⚪ |
| **Entity Count** | ___ | ⚪ |
| **Draw Calls** | ___ | ⚪ |
| **Memory Usage** | ___ MB | ⚪ |
| **Update Time** | ___ ms | ⚪ |
| **Render Time** | ___ ms | ⚪ |

**Notes**: 


---

### Test 4: 15 Agents

| Metric | Value | Status |
|--------|-------|--------|
| **FPS** | ___ | ⚪ |
| **Entity Count** | ___ | ⚪ |
| **Draw Calls** | ___ | ⚪ |
| **Memory Usage** | ___ MB | ⚪ |
| **Update Time** | ___ ms | ⚪ |
| **Render Time** | ___ ms | ⚪ |

**Notes**: 


---

### Test 5: 20 Agents (Stress Test)

| Metric | Value | Status |
|--------|-------|--------|
| **FPS** | ___ | ⚪ |
| **Entity Count** | ___ | ⚪ |
| **Draw Calls** | ___ | ⚪ |
| **Memory Usage** | ___ MB | ⚪ |
| **Update Time** | ___ ms | ⚪ |
| **Render Time** | ___ ms | ⚪ |

**Notes**: 


---

## Quality Level Comparison (10 Agents)

### HIGH Quality

| Metric | Value |
|--------|-------|
| FPS | ___ |
| Memory | ___ MB |
| Draw Calls | ___ |

**Features**: All enabled

---

### MEDIUM Quality

| Metric | Value |
|--------|-------|
| FPS | ___ |
| Memory | ___ MB |
| Draw Calls | ___ |

**Features**: Shadows disabled, particles reduced 50%

---

### LOW Quality

| Metric | Value |
|--------|-------|
| FPS | ___ |
| Memory | ___ MB |
| Draw Calls | ___ |

**Features**: Shadows disabled, particles reduced 80%, effects disabled

---

### PERFORMANCE Mode

| Metric | Value |
|--------|-------|
| FPS | ___ |
| Memory | ___ MB |
| Draw Calls | ___ |

**Features**: Particles disabled, animations disabled

---

## Bottleneck Analysis

### Rendering Bottlenecks
- [ ] Draw calls too high (> 100)
- [ ] Texture switching overhead
- [ ] Sprite batching not effective
- [ ] Too many visible entities

**Details**: 


---

### Update Loop Bottlenecks
- [ ] Entity updates too slow
- [ ] Animation system overhead
- [ ] Movement calculations
- [ ] Collision detection

**Details**: 


---

### Memory Bottlenecks
- [ ] Texture memory usage high
- [ ] Entity memory leaks
- [ ] Particle pooling issues
- [ ] Asset loading problems

**Details**: 


---

## Browser DevTools Profiling

### Chrome Performance Tab
1. Record 10-second profile with 10 agents
2. Identify top 5 functions by time:
   - 1. ___
   - 2. ___
   - 3. ___
   - 4. ___
   - 5. ___

### Memory Snapshot
- **Heap Size**: ___ MB
- **Detached DOM Nodes**: ___
- **Event Listeners**: ___

---

## Optimization Targets

Based on profiling results, prioritize these optimizations:

### High Priority
1. [ ] ___
2. [ ] ___
3. [ ] ___

### Medium Priority
1. [ ] ___
2. [ ] ___

### Low Priority
1. [ ] ___

---

## Performance Targets vs Actual

| Target | Actual | Status |
|--------|--------|--------|
| 60 FPS (desktop) | ___ FPS | ⚪ |
| < 3s load time | ___ s | ⚪ |
| < 100 MB memory | ___ MB | ⚪ |
| < 50 draw calls | ___ calls | ⚪ |

**Legend**: ✅ Met | ⚠️ Close | ❌ Not Met

---

## Recommendations

### Immediate Actions
1. ___
2. ___
3. ___

### Future Improvements
1. ___
2. ___

---

## Conclusion

**Overall Performance**: [Excellent / Good / Acceptable / Needs Improvement]

**Summary**: 


**Next Steps**: 


"@

# Write template to file
$template | Out-File -FilePath $resultsFile -Encoding UTF8

Write-Host "✓ Performance profile template created: $resultsFile" -ForegroundColor Green
Write-Host ""

# Open the file
Write-Host "Opening performance profile template..." -ForegroundColor Yellow
Start-Process $resultsFile

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Profiling Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open game in browser:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173/app" -ForegroundColor White
Write-Host ""
Write-Host "2. Enable Dev Mode in console:" -ForegroundColor Yellow
Write-Host "   localStorage.setItem('devMode', 'true')" -ForegroundColor White
Write-Host "   location.reload()" -ForegroundColor White
Write-Host ""
Write-Host "3. Toggle Performance Monitor:" -ForegroundColor Yellow
Write-Host "   Press 'D' key" -ForegroundColor White
Write-Host ""
Write-Host "4. For each agent count (1, 5, 10, 15, 20):" -ForegroundColor Yellow
Write-Host "   - Let the game run for $DurationSeconds seconds" -ForegroundColor White
Write-Host "   - Record all metrics from the overlay" -ForegroundColor White
Write-Host "   - Fill in the template file" -ForegroundColor White
Write-Host ""
Write-Host "5. Test each quality level (Ctrl+1-4):" -ForegroundColor Yellow
Write-Host "   - HIGH (Ctrl+1)" -ForegroundColor White
Write-Host "   - MEDIUM (Ctrl+2)" -ForegroundColor White
Write-Host "   - LOW (Ctrl+3)" -ForegroundColor White
Write-Host "   - PERFORMANCE (Ctrl+4)" -ForegroundColor White
Write-Host ""
Write-Host "6. Use Chrome DevTools for detailed profiling:" -ForegroundColor Yellow
Write-Host "   - F12 → Performance tab" -ForegroundColor White
Write-Host "   - Record 10-second profile" -ForegroundColor White
Write-Host "   - Analyze flame graph" -ForegroundColor White
Write-Host ""
Write-Host "7. Take memory snapshots:" -ForegroundColor Yellow
Write-Host "   - F12 → Memory tab" -ForegroundColor White
Write-Host "   - Take heap snapshot" -ForegroundColor White
Write-Host "   - Check for memory leaks" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Profile template saved to: $resultsFile" -ForegroundColor Green
Write-Host ""
Write-Host "After completing the profiling, review the results and" -ForegroundColor Yellow
Write-Host "identify optimization targets for Tasks 5.2 and 5.3." -ForegroundColor Yellow
Write-Host ""
