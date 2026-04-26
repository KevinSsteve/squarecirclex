# Asset Download and Organization Guide

**Task**: 1.1 Asset Research and Acquisition (Continued)  
**Date**: 2026-04-19  
**Status**: Ready for Manual Download

---

## Overview

This guide walks you through downloading and organizing the isometric office assets for the 3D visual upgrade. The research phase is complete, and we've identified excellent free sources. Now it's time to get the actual files.

---

## Quick Start

### Option 1: Automated Organization (Recommended)

1. **Download assets** from the sources below
2. **Extract** them to `.\downloads\` folder
3. **Run the organization script**:
   ```powershell
   .\scripts\organize-3d-assets.ps1
   ```

### Option 2: Manual Organization

1. Download assets
2. Manually place files in:
   - `frontend/public/assets/sprites/furniture/`
   - `frontend/public/assets/sprites/decorations/`
   - `frontend/public/assets/sprites/characters/`
   - `frontend/public/assets/sprites/environment/`
   - `frontend/public/assets/sprites/shadows/`

---

## Asset Sources

### 1. Kenney Isometric Prototypes (PRIMARY SOURCE)

**Why**: High quality, consistent style, CC0 license, includes character animations

**Download**:
- **URL**: https://kenney-assets.itch.io/isometric-prototypes-tiles
- **License**: CC0 1.0 Universal (Public Domain)
- **Cost**: Free (donations appreciated)
- **Size**: ~10-20 MB

**What's Included**:
- ✅ Walls, floors, objects, doorways
- ✅ Character with 8-direction animations (idle, walk, work)
- ✅ Furniture pieces
- ✅ Environment tiles
- ✅ Unity and Tiled samples

**Download Steps**:
1. Visit the URL above
2. Click "Download Now" or "Name your own price" (enter $0 for free)
3. Extract the ZIP file
4. Look for PNG files in the extracted folder

**Expected Files**:
- `isometric-prototypes-tiles.png` (sprite sheet)
- Individual PNG files for each sprite
- Sample project files (optional)

---

### 2. Office Interior Tileset (SUPPLEMENTARY)

**Why**: Office-specific items (desks, computers, coffee machine)

**Download**:
- **URL**: https://donarg.itch.io/officetileset
- **License**: Check on page (usually free for commercial use)
- **Cost**: Free or Pay What You Want
- **Size**: ~5-10 MB

**What's Included**:
- ✅ Desks, chairs, computers
- ✅ Coffee machine, bookshelves
- ✅ Wall decorations
- ✅ Office equipment

**Download Steps**:
1. Visit the URL above
2. Download the tileset
3. Extract the ZIP file
4. Look for 16x16 or 32x32 PNG tiles

---

### 3. Isometric Character Templates (OPTIONAL)

**Why**: Additional character variations if Kenney's character isn't sufficient

**Download**:
- **URL**: https://pixel-salvaje.itch.io/isometric-character-template-64-pixel-art
- **License**: Check on page
- **Cost**: Usually free or low cost
- **Size**: ~2-5 MB

**What's Included**:
- ✅ 8-direction character sprites
- ✅ 4 frames per animation
- ✅ IDLE animation included
- ✅ Template for creating variations

---

## Organization Script Usage

### Basic Usage

```powershell
# Organize assets from default download folder
.\scripts\organize-3d-assets.ps1

# Specify custom download path
.\scripts\organize-3d-assets.ps1 -DownloadPath "C:\Downloads\game-assets"

# Dry run (preview without copying)
.\scripts\organize-3d-assets.ps1 -DryRun

# Verbose output
.\scripts\organize-3d-assets.ps1 -Verbose
```

### What the Script Does

1. **Scans** the download folder for asset files (.png, .jpg, .json)
2. **Categorizes** files based on filename keywords:
   - `desk`, `chair`, `table` → furniture
   - `plant`, `poster`, `art` → decorations
   - `character`, `agent`, `walk` → characters
   - `floor`, `wall`, `carpet` → environment
   - `shadow` → shadows
3. **Copies** files to appropriate folders
4. **Reports** statistics and any uncategorized files

### Expected Output

```
▶ Scanning for assets in: .\downloads
ℹ Found 127 files to process

▶ Organization Summary

Overall Statistics:
  Total Files Found:    127
  Successfully Organized: 115
  Skipped:              8
  Errors:               0

Files by Category:
  characters     : 32
  decorations    : 18
  environment    : 25
  furniture      : 35
  shadows        : 5
  unknown        : 4

⚠ 4 files couldn't be categorized automatically
  Review the 'unknown' folder and manually move files to correct categories
```

---

## Manual Organization Steps

If you prefer to organize manually or need to fix categorization:

### 1. Create Folder Structure (Already Done)

```
frontend/public/assets/sprites/
├── furniture/
├── decorations/
├── characters/
├── environment/
└── shadows/
```

### 2. Sort Files by Type

**Furniture** (`furniture/`):
- Desks, chairs, tables
- Shelves, cabinets, bookcases
- Office equipment

**Decorations** (`decorations/`):
- Plants (potted, desk, floor)
- Wall art, posters, whiteboards
- Desk items (mugs, lamps, papers)

**Characters** (`characters/`):
- Character sprite sheets
- Animation frames (idle, walking, working, celebrating)
- 8-direction sprites

**Environment** (`environment/`):
- Floor tiles
- Wall segments
- Carpets
- Windows, doors

**Shadows** (`shadows/`):
- Circular shadows (small, medium, large)
- Character shadows
- Furniture shadows

### 3. Verify File Specifications

Each sprite should meet these specs:
- **Format**: PNG with transparency
- **Size**: 64×64 pixels (base tile size)
- **Angle**: 30-degree isometric
- **Ratio**: 2:1 (width:height)
- **Color**: 32-bit RGBA

---

## Asset Verification Checklist

After organizing, verify your assets:

### Visual Check
- [ ] All sprites have transparent backgrounds
- [ ] Sprites maintain consistent isometric angle
- [ ] Colors are vibrant and clear
- [ ] No artifacts or compression issues

### File Check
- [ ] All PNG files are in correct folders
- [ ] File names are descriptive and consistent
- [ ] No duplicate files
- [ ] Total size is under 100 MB

### Category Check
- [ ] Furniture folder has desks, chairs, shelves
- [ ] Decorations folder has plants, wall art
- [ ] Characters folder has animation frames
- [ ] Environment folder has floors, walls
- [ ] Shadows folder has shadow sprites

---

## Creating Atlas Definitions

For each sprite sheet, you'll need a JSON atlas definition. The organization script creates sample templates, but you'll need to update them with actual frame data.

### Sample Atlas Format

```json
{
  "frames": {
    "desk-0": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 },
      "anchor": { "x": 0.5, "y": 0.5 }
    },
    "desk-1": {
      "frame": { "x": 64, "y": 0, "w": 64, "h": 64 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 },
      "anchor": { "x": 0.5, "y": 0.5 }
    }
  },
  "meta": {
    "app": "TexturePacker",
    "version": "1.0",
    "image": "desks.png",
    "format": "RGBA8888",
    "size": { "w": 512, "h": 512 },
    "scale": "1"
  }
}
```

### Tools for Creating Atlases

**Option 1: TexturePacker** (Recommended)
- URL: https://www.codeandweb.com/texturepacker
- Free version available
- Automatically generates JSON definitions
- Optimizes sprite packing

**Option 2: Shoebox** (Free)
- URL: https://renderhjs.net/shoebox/
- Free sprite packing tool
- Exports to various formats

**Option 3: Manual Creation**
- Use the sample JSON as template
- Calculate frame positions manually
- Update x, y, w, h values for each sprite

---

## Troubleshooting

### Issue: Script can't find download folder

**Solution**:
```powershell
# Create the folder
New-Item -ItemType Directory -Path ".\downloads" -Force

# Or specify a different path
.\scripts\organize-3d-assets.ps1 -DownloadPath "C:\Your\Path"
```

### Issue: Files categorized incorrectly

**Solution**:
1. Check the `unknown` folder
2. Manually move files to correct categories
3. Update the script's keyword rules if needed

### Issue: Missing sprite sheets

**Solution**:
- Verify you downloaded all recommended packs
- Check if files are in subfolders of the download directory
- The script scans recursively, so nested folders are OK

### Issue: Atlas definitions not created

**Solution**:
- The script creates sample templates only
- You'll need to update them with actual frame data
- Use TexturePacker or similar tool for automatic generation

---

## Next Steps

Once assets are organized:

1. **Verify Organization**:
   ```powershell
   Get-ChildItem .\frontend\public\assets\sprites -Recurse
   ```

2. **Create/Update Atlas Definitions**:
   - Use TexturePacker or manual JSON editing
   - Ensure frame coordinates are correct

3. **Test Asset Loading**:
   - Start development server
   - Check browser console for errors
   - Verify sprites load correctly

4. **Proceed to Task 1.2**:
   - Implement SpriteAtlasManager
   - Integrate with AssetLoader
   - Test sprite extraction

---

## Asset Inventory Summary

Based on `ASSET_INVENTORY.md`:

**Total Sprites Needed**: 500-600 individual sprites
- **Characters**: 360 sprites (72 per agent type × 5 types)
- **Furniture**: ~60 sprites
- **Decorations**: ~40 sprites
- **Environment**: ~40 sprites
- **Shadows**: ~10 sprites

**Estimated Total Size**: 50-80 MB
**Quality Level**: High (using Kenney + Office Interior Tileset)
**Budget**: $0 for MVP

---

## License Compliance

### CC0 Assets (Kenney)
- ✅ Commercial use allowed
- ✅ No attribution required (but appreciated)
- ✅ Modification allowed
- ✅ Redistribution allowed

### CC-BY Assets (Some itch.io)
- ✅ Commercial use allowed
- ⚠️ Attribution required
- ✅ Modification allowed
- ✅ Redistribution allowed

**Action**: Create `ASSET_CREDITS.md` with all attributions

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the `ASSET_INVENTORY.md` for detailed requirements
3. Verify asset specifications match requirements
4. Test with a small subset of assets first

---

## Status Tracking

- [x] Asset research complete
- [x] Folder structure created
- [x] Organization script created
- [ ] Assets downloaded
- [ ] Assets organized
- [ ] Atlas definitions created
- [ ] Assets verified
- [ ] Ready for Task 1.2

---

**Last Updated**: 2026-04-19  
**Next Task**: Task 1.2 - Sprite Atlas System
