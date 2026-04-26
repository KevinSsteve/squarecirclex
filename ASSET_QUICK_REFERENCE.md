# Asset Organization - Quick Reference

## 🚀 Quick Start

```powershell
# 1. Download assets from sources below
# 2. Extract to .\downloads\
# 3. Run organization script
.\scripts\organize-3d-assets.ps1
```

---

## 📥 Download Links

| Source | URL | Priority |
|--------|-----|----------|
| **Kenney Prototypes** | https://kenney-assets.itch.io/isometric-prototypes-tiles | ⭐ PRIMARY |
| **Office Interior** | https://donarg.itch.io/officetileset | ⭐ SECONDARY |
| **Character Templates** | https://pixel-salvaje.itch.io/isometric-character-template-64-pixel-art | Optional |

---

## 📁 Folder Structure

```
frontend/public/assets/sprites/
├── furniture/       (desks, chairs, shelves)
├── decorations/     (plants, art, desk items)
├── characters/      (agent sprites, animations)
├── environment/     (floors, walls, carpets)
└── shadows/         (shadow sprites)
```

---

## 🔧 Script Commands

```powershell
# Basic usage
.\scripts\organize-3d-assets.ps1

# Dry run (preview only)
.\scripts\organize-3d-assets.ps1 -DryRun

# Custom download path
.\scripts\organize-3d-assets.ps1 -DownloadPath "C:\Downloads\assets"

# Verbose output
.\scripts\organize-3d-assets.ps1 -Verbose
```

---

## ✅ Verification Checklist

- [ ] All sprites are PNG with transparency
- [ ] Sprites are 64×64 pixels (base size)
- [ ] Isometric angle: 30 degrees, 2:1 ratio
- [ ] Total size under 100 MB
- [ ] Files organized in correct folders
- [ ] Atlas definitions created (JSON)

---

## 📊 Expected Asset Count

| Category | Count | Size |
|----------|-------|------|
| Characters | 360 sprites | ~20 MB |
| Furniture | ~60 sprites | ~10 MB |
| Decorations | ~40 sprites | ~8 MB |
| Environment | ~40 sprites | ~10 MB |
| Shadows | ~10 sprites | ~2 MB |
| **TOTAL** | **~510 sprites** | **~50 MB** |

---

## 🎯 Next Steps

1. ✅ Download assets
2. ✅ Run organization script
3. ✅ Verify organization
4. ✅ Create atlas definitions
5. ➡️ Proceed to Task 1.2 (Sprite Atlas System)

---

## 📖 Full Documentation

- **Detailed Guide**: `ASSET_DOWNLOAD_GUIDE.md`
- **Asset Inventory**: `ASSET_INVENTORY.md`
- **Task Completion**: `GAME_3D_TASK_1.1_COMPLETE.md`

---

## 🆘 Quick Troubleshooting

**Script can't find downloads?**
```powershell
New-Item -ItemType Directory -Path ".\downloads" -Force
```

**Files in wrong category?**
- Check `unknown` folder
- Manually move to correct location

**Need atlas definitions?**
- Use TexturePacker (free version)
- Or manually create JSON files

---

**Status**: Ready for asset download  
**Time Estimate**: 30-60 minutes  
**Next Task**: Task 1.2 - Sprite Atlas System
