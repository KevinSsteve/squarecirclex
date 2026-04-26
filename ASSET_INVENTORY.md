# Asset Inventory - 3D Visual Upgrade

**Date**: 2026-04-19  
**Status**: Research Complete  
**License Strategy**: CC0 / Public Domain + Optional Premium

---

## Asset Sources Identified

### Free Sources (CC0 / Public Domain)

#### 1. Kenney.nl Assets
**License**: CC0 1.0 Universal (Public Domain)  
**Cost**: Free (donations appreciated)  
**Quality**: High, consistent art style

**Recommended Packs**:
- [Isometric Prototypes Tiles](https://kenney-assets.itch.io/isometric-prototypes-tiles)
  - Walls, floors, objects, doorways
  - Includes character (8 directions, 3 animations)
  - Unity and Tiled samples included
  
- [Isometric Library Tiles](https://kenney-assets.itch.io/isometric-library-tiles)
  - Tables, bookcases, library furniture
  - Good for office environment
  
- [Isometric Miniature Library](https://kenney.nl/assets/isometric-miniature-library)
  - Additional furniture and decorations

**Status**: ✅ Identified, ready to download

#### 2. OpenGameArt.org
**License**: Various (mostly CC0, CC-BY)  
**Cost**: Free  
**Quality**: Variable

**Useful Collections**:
- [2D::Sprite::Isometric](https://opengameart.org/content/2dspriteisometric)
  - Character templates
  - Various isometric sprites
  
- [Isometric Character Template](https://opengameart.org/content/isometric-character-template)
  - Base character sprites

**Status**: ✅ Identified, backup option

#### 3. itch.io Free Assets
**License**: Various (check individual)  
**Cost**: Free  
**Quality**: Variable

**Recommended Packs**:
- [Interiors and Furniture](https://gedargames.itch.io/interiors-and-furniture)
  - Floors, walls, furniture
  - 4 variants per rotation
  
- [Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset)
  - Desks, chairs, computers
  - Coffee machine, bookshelves
  - Wall decorations
  
- [Isometric Character Animations Template](https://pixel-salvaje.itch.io/isometric-character-template-64-pixel-art)
  - 8 directions, 4 frames each
  - IDLE animation included

**Status**: ✅ Identified, ready to evaluate

### Premium Options (If Budget Available)

#### 1. itch.io Premium Packs
**Cost**: $10-30  
**Quality**: Professional

**Options**:
- [Pixel Art Furniture Pack](https://sierrassets.itch.io/pixel-art-furniture-pack)
  - 520+ sprites, 213+ unique
  - Editable spritesheets
  - Cost: ~$15
  
- [Office Tile Map & Sprites](https://xanderwood.itch.io/office-tile-map-sprites)
  - 16x16 tiles
  - 100% royalty free
  - Cost: ~$10

**Status**: ⏸️ On hold, evaluate free options first

---

## Asset Requirements by Category

### 1. Environment Assets

#### Floors (Priority: HIGH)
- [ ] Base floor tiles (wood/tile texture)
- [ ] Carpet tiles (5 colors for departments)
- [ ] Floor transitions
- [ ] Grid markers (optional, for debugging)

**Estimated Count**: 10-15 sprites  
**Source**: Kenney Isometric Prototypes

#### Walls (Priority: HIGH)
- [ ] Wall segments (back)
- [ ] Wall segments (front)
- [ ] Windows
- [ ] Doors
- [ ] Department dividers

**Estimated Count**: 15-20 sprites  
**Source**: Kenney Isometric Prototypes

### 2. Furniture Assets

#### Desks (Priority: HIGH)
- [ ] Standard desk (4 rotations)
- [ ] Executive desk (4 rotations)
- [ ] Creative desk (4 rotations)
- [ ] Desk with computer
- [ ] Desk with laptop

**Estimated Count**: 20-25 sprites  
**Source**: Office Interior Tileset or Kenney

#### Chairs (Priority: HIGH)
- [ ] Office chair (4 rotations)
- [ ] Executive chair (4 rotations)
- [ ] Casual chair (4 rotations)

**Estimated Count**: 12-15 sprites  
**Source**: Office Interior Tileset or Kenney

#### Storage (Priority: MEDIUM)
- [ ] Bookshelf (4 rotations)
- [ ] Filing cabinet (4 rotations)
- [ ] Storage cabinet (4 rotations)

**Estimated Count**: 12-15 sprites  
**Source**: Kenney Library Tiles

#### Equipment (Priority: MEDIUM)
- [ ] Computer monitor
- [ ] Laptop
- [ ] Printer
- [ ] Coffee machine
- [ ] Water cooler

**Estimated Count**: 10-12 sprites  
**Source**: Office Interior Tileset

### 3. Decoration Assets

#### Plants (Priority: HIGH)
- [ ] Small potted plant (4 rotations)
- [ ] Large potted plant (4 rotations)
- [ ] Desk plant
- [ ] Floor plant

**Estimated Count**: 12-16 sprites  
**Source**: Kenney or Interiors pack

#### Wall Decorations (Priority: MEDIUM)
- [ ] Whiteboard
- [ ] Bulletin board
- [ ] Wall art/posters (5 variants)
- [ ] Clock
- [ ] Calendar

**Estimated Count**: 10-12 sprites  
**Source**: Office Interior Tileset

#### Desk Items (Priority: LOW)
- [ ] Coffee mug
- [ ] Papers/documents
- [ ] Pen holder
- [ ] Desk lamp
- [ ] Mouse
- [ ] Keyboard

**Estimated Count**: 8-10 sprites  
**Source**: Office Interior Tileset

### 4. Character Assets

#### Base Character (Priority: CRITICAL)
- [ ] Idle animation (8 directions × 4 frames = 32 sprites)
- [ ] Walking animation (8 directions × 4 frames = 32 sprites)
- [ ] Working animation (1 direction × 4 frames = 4 sprites)
- [ ] Celebrating animation (1 direction × 4 frames = 4 sprites)

**Total Sprites**: 72 sprites per character type  
**Character Types Needed**: 5 (one per agent type)  
**Total Character Sprites**: 360 sprites

**Source**: 
- Primary: Kenney Isometric Prototypes (includes character)
- Alternative: Isometric Character Template packs
- Fallback: Create variations from base template

#### Character Variations (Priority: HIGH)
- [ ] Content Creator (creative outfit, bright colors)
- [ ] Publisher (professional outfit)
- [ ] Analyst (business casual)
- [ ] Support Agent (casual, friendly)
- [ ] Administrator (formal, executive)

**Implementation**: Color swaps and minor modifications of base character

### 5. Shadow Assets

#### Shadow Sprites (Priority: HIGH)
- [ ] Circular shadow (small) - for desk items
- [ ] Circular shadow (medium) - for characters
- [ ] Circular shadow (large) - for furniture
- [ ] Elliptical shadow (furniture)

**Estimated Count**: 4-6 sprites  
**Source**: Create programmatically or simple PNG

---

## Asset Organization Structure

```
/public/assets/sprites/
├── furniture/
│   ├── desks.png (sprite sheet)
│   ├── desks.json (atlas definition)
│   ├── chairs.png
│   ├── chairs.json
│   ├── storage.png
│   ├── storage.json
│   └── equipment.png
│       └── equipment.json
├── decorations/
│   ├── plants.png
│   ├── plants.json
│   ├── wall-art.png
│   ├── wall-art.json
│   └── desk-items.png
│       └── desk-items.json
├── characters/
│   ├── base-idle.png (8 directions × 4 frames)
│   ├── base-idle.json
│   ├── base-walking.png (8 directions × 4 frames)
│   ├── base-walking.json
│   ├── base-working.png (4 frames)
│   ├── base-working.json
│   ├── base-celebrating.png (4 frames)
│   └── base-celebrating.json
├── environment/
│   ├── floors.png
│   ├── floors.json
│   ├── walls.png
│   ├── walls.json
│   ├── carpets.png
│   └── carpets.json
└── shadows/
    ├── shadows-circular.png
    └── shadows-circular.json
```

---

## Asset Specifications

### Technical Requirements

**Sprite Dimensions**:
- Base tile size: 64×64 pixels (isometric)
- Character size: 64×64 pixels
- Furniture: Variable (64×64 to 128×128)
- Decorations: Variable (32×32 to 64×64)

**File Formats**:
- Sprites: PNG with transparency
- Atlas definitions: JSON (TexturePacker format)

**Color Depth**:
- 32-bit RGBA
- Transparent backgrounds

**Isometric Angle**:
- 30-degree angle
- 2:1 ratio (width:height)

### Performance Targets

**Total Asset Size**: < 100 MB  
**Individual Sprite Sheet**: < 2 MB  
**Atlas Efficiency**: > 80% texture usage

---

## Download Plan

### Phase 1: Critical Assets (Day 1)
1. Download Kenney Isometric Prototypes Tiles
2. Download Office Interior Tileset (itch.io)
3. Download Isometric Character Template
4. Extract and organize into folder structure

### Phase 2: Supplementary Assets (Day 1-2)
1. Download Kenney Library Tiles (for furniture)
2. Download Interiors and Furniture pack
3. Evaluate quality and consistency
4. Select best sprites from each pack

### Phase 3: Character Customization (Day 2)
1. Create character variations (color swaps)
2. Test animations in game
3. Adjust if needed

### Phase 4: Shadow Creation (Day 2)
1. Create shadow sprites programmatically
2. Export as PNG
3. Create atlas definitions

---

## License Compliance

### CC0 Assets (Kenney, some itch.io)
- ✅ Commercial use allowed
- ✅ No attribution required (but appreciated)
- ✅ Modification allowed
- ✅ Redistribution allowed

### CC-BY Assets (some OpenGameArt)
- ✅ Commercial use allowed
- ⚠️ Attribution required
- ✅ Modification allowed
- ✅ Redistribution allowed

**Attribution File**: Create `ASSET_CREDITS.md` with all attributions

---

## Backup Strategy

If free assets don't meet quality standards:

**Option A**: Purchase premium pack ($20-30)
- Pixel Art Furniture Pack (itch.io)
- Professional quality
- Immediate availability

**Option B**: Commission custom assets ($500-1000)
- Unique art style
- Perfect fit for requirements
- Longer timeline (2-3 weeks)

**Option C**: Mix and match
- Use free assets for most elements
- Commission only unique/missing pieces
- Cost: $100-300

---

## Next Steps

1. ✅ Research complete
2. ⏭️ Download Kenney Isometric Prototypes Tiles
3. ⏭️ Download Office Interior Tileset
4. ⏭️ Download character templates
5. ⏭️ Organize assets into folder structure
6. ⏭️ Create sprite atlases
7. ⏭️ Test loading in game

---

## Notes

- **Recommendation**: Start with Kenney assets (high quality, consistent style, CC0)
- **Fallback**: Supplement with Office Interior Tileset for office-specific items
- **Character Strategy**: Use Kenney character as base, create color variations
- **Budget**: $0 for MVP, $20-30 if premium quality needed
- **Timeline**: 1-2 days for asset acquisition and organization

---

## Status Summary

**Assets Identified**: ✅ Complete  
**Folder Structure**: ✅ Created  
**Download Links**: ✅ Documented  
**License Review**: ✅ Verified  
**Ready to Download**: ✅ Yes

**Estimated Total Sprites**: 500-600 individual sprites  
**Estimated Total Size**: 50-80 MB  
**Quality Level**: High (using Kenney + Office Interior Tileset)
