import {
  AvatarEquipmentSlotSchema,
  AvatarManifestSchema,
  CosmeticCatalogItemSchema,
  PlayerAvatarInventorySchema,
  defaultAvatar
} from '../../../../packages/shared/src/index.js';
import {
  CosmeticItem,
  PlayerInventory,
  PlayerProfile
} from '../models/index.js';

export const avatarCatalogItems = Object.freeze([
  {
    cosmeticId: 'body_neon_hero',
    type: 'body',
    slot: 'body',
    title: 'Neon Hero',
    description: 'Tall human arcade-hero base with sharper 80s action proportions.',
    rarity: 'common',
    compatibleBodyTypes: ['hero'],
    asset2d: { shape: 'hero-silhouette' },
    asset3d: { primitive: 'human-hero-rig' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 5
  },
  {
    cosmeticId: 'body_runner_core',
    type: 'body',
    slot: 'body',
    title: 'Track Runner',
    description: 'Balanced arcade runner proportions for 2D and 3D games.',
    rarity: 'common',
    compatibleBodyTypes: ['runner'],
    asset2d: { shape: 'runner-silhouette' },
    asset3d: { primitive: 'athletic-rig' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 10
  },
  {
    cosmeticId: 'body_street_legend',
    type: 'body',
    slot: 'body',
    title: 'Street Legend',
    description: 'Lean human base built for jackets, shades, and beat-em-up silhouettes.',
    rarity: 'common',
    compatibleBodyTypes: ['street'],
    asset2d: { shape: 'street-silhouette' },
    asset3d: { primitive: 'lean-human-rig' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 12
  },
  {
    cosmeticId: 'body_synth_athlete',
    type: 'body',
    slot: 'body',
    title: 'Synth Athlete',
    description: 'Athletic human base with long legs and strong shoulders.',
    rarity: 'rare',
    compatibleBodyTypes: ['runner'],
    asset2d: { shape: 'athlete-silhouette' },
    asset3d: { primitive: 'athletic-human-rig' },
    preview: { swatch: '#FFD400' },
    sortOrder: 14
  },
  {
    cosmeticId: 'body_android_prime',
    type: 'body',
    slot: 'body',
    title: 'Android Prime',
    description: 'Sharper shoulders and plated limbs for sci-fi games.',
    rarity: 'rare',
    compatibleBodyTypes: ['android'],
    asset2d: { shape: 'android-silhouette' },
    asset3d: { primitive: 'plated-rig' },
    preview: { swatch: '#8B2CFF' },
    unlockRule: { xpRequired: 250 },
    sortOrder: 20
  },
  {
    cosmeticId: 'body_guardian_frame',
    type: 'body',
    slot: 'body',
    title: 'Guardian Frame',
    description: 'Broad human-superhero stance for bosses, tanks, and co-op heroes.',
    rarity: 'rare',
    compatibleBodyTypes: ['guardian'],
    asset2d: { shape: 'guardian-silhouette' },
    asset3d: { primitive: 'broad-human-rig' },
    preview: { swatch: '#25FF9A' },
    sortOrder: 22
  },
  {
    cosmeticId: 'head_spark',
    type: 'head',
    slot: 'head',
    title: 'Spark Head',
    description: 'Clean Player Passport starter head.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { shape: 'round-head' },
    asset3d: { primitive: 'sphere-head' },
    sortOrder: 30
  },
  {
    cosmeticId: 'head_neon_human',
    type: 'head',
    slot: 'head',
    title: 'Neon Human',
    description: 'Human profile head with clean cabinet-card readability.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { shape: 'human-head' },
    asset3d: { primitive: 'human-head' },
    sortOrder: 32
  },
  {
    cosmeticId: 'head_arcade_star',
    type: 'head',
    slot: 'head',
    title: 'Arcade Star',
    description: 'A sharper profile built for leaderboard portraits.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { shape: 'star-head' },
    asset3d: { primitive: 'faceted-head' },
    unlockRule: { xpRequired: 500 },
    sortOrder: 40
  },
  {
    cosmeticId: 'head_rebel_cut',
    type: 'head',
    slot: 'head',
    title: 'Rebel Cut',
    description: 'Angular head profile for punk and action-hero builds.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { shape: 'rebel-head' },
    asset3d: { primitive: 'angular-head' },
    sortOrder: 42
  },
  {
    cosmeticId: 'head_cyberhawk',
    type: 'head',
    slot: 'head',
    title: 'Cyberhawk',
    description: 'Tall profile with mohawk-friendly 80s silhouette.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { shape: 'mohawk-head' },
    asset3d: { primitive: 'mohawk-head' },
    sortOrder: 44
  },
  {
    cosmeticId: 'hair_none',
    type: 'hair',
    slot: 'hair',
    title: 'No Hair',
    description: 'Clean head silhouette for helmets and android looks.',
    rarity: 'common',
    asset2d: { layer: 'none' },
    asset3d: { primitive: 'none' },
    sortOrder: 45
  },
  {
    cosmeticId: 'hair_glowhawk',
    type: 'hair',
    slot: 'hair',
    title: 'Glowhawk',
    description: 'High neon mohawk built for the arcade-badass look.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'glowhawk' },
    asset3d: { primitive: 'mohawk-spine' },
    preview: { swatch: '#FFD400' },
    sortOrder: 46
  },
  {
    cosmeticId: 'hair_side_part',
    type: 'hair',
    slot: 'hair',
    title: 'Side Part',
    description: 'Clean swept hairstyle for hero and profile-card looks.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'side-part' },
    asset3d: { primitive: 'swept-hair-cap' },
    preview: { swatch: '#8B2CFF' },
    sortOrder: 46
  },
  {
    cosmeticId: 'hair_short_crop',
    type: 'hair',
    slot: 'hair',
    title: 'Short Crop',
    description: 'Simple close-cropped hair that works under most helmets.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'short-crop' },
    asset3d: { primitive: 'short-hair-cap' },
    preview: { swatch: '#111827' },
    sortOrder: 46
  },
  {
    cosmeticId: 'hair_viper_sweep',
    type: 'hair',
    slot: 'hair',
    title: 'Viper Sweep',
    description: 'Tall sculpted 80s hair with neon edge lighting.',
    rarity: 'common',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'viper-sweep' },
    asset3d: { primitive: 'tall-hair' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 47
  },
  {
    cosmeticId: 'hair_laser_mullet',
    type: 'hair',
    slot: 'hair',
    title: 'Laser Mullet',
    description: 'Retro arcade mullet with a bright side stripe.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'laser-mullet' },
    asset3d: { primitive: 'mullet-slab' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 48
  },
  {
    cosmeticId: 'hair_classic_mullet',
    type: 'hair',
    slot: 'hair',
    title: 'Classic Mullet',
    description: 'Business up front, arcade party in the back.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'classic-mullet' },
    asset3d: { primitive: 'mullet-cap' },
    preview: { swatch: '#2b1720' },
    sortOrder: 48
  },
  {
    cosmeticId: 'hair_feathered_mullet',
    type: 'hair',
    slot: 'hair',
    title: 'Feathered Mullet',
    description: 'Layered 80s feathered hair with longer neck coverage.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'feathered-mullet' },
    asset3d: { primitive: 'layered-mullet' },
    preview: { swatch: '#5b3525' },
    sortOrder: 48
  },
  {
    cosmeticId: 'hair_midnight_curls',
    type: 'hair',
    slot: 'hair',
    title: 'Midnight Curls',
    description: 'Rounded high-volume curls with a subtle neon rim.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { layer: 'midnight-curls' },
    asset3d: { primitive: 'curl-cluster' },
    preview: { swatch: '#8B2CFF' },
    sortOrder: 49
  },
  {
    cosmeticId: 'helmet_vector',
    type: 'helmet',
    slot: 'helmet',
    title: 'Vector Full Helmet',
    description: 'Full head-covering arcade helmet with neon trim.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { layer: 'full-helmet-vector' },
    asset3d: { primitive: 'full-helmet' },
    sortOrder: 50
  },
  {
    cosmeticId: 'helmet_none',
    type: 'helmet',
    slot: 'helmet',
    title: 'No Helmet',
    description: 'Bare head with only hair and visor accessories.',
    rarity: 'common',
    asset2d: { layer: 'none' },
    asset3d: { primitive: 'none' },
    sortOrder: 51
  },
  {
    cosmeticId: 'helmet_mohawk_glow',
    type: 'helmet',
    slot: 'helmet',
    title: 'Ridge Rider Helmet',
    description: 'Full motocross-style helmet with a glowing top ridge.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { layer: 'ridge-rider-helmet' },
    asset3d: { primitive: 'full-ridge-helmet' },
    preview: { swatch: '#FFD400' },
    sortOrder: 52
  },
  {
    cosmeticId: 'helmet_mtb_fullface',
    type: 'helmet',
    slot: 'helmet',
    title: 'Full-Face MTB Helmet',
    description: 'Downhill bike helmet with top peak and open chin guard.',
    rarity: 'common',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'mtb-full-face-helmet' },
    asset3d: { primitive: 'mtb-full-face' },
    preview: { swatch: '#25FF9A' },
    sortOrder: 53
  },
  {
    cosmeticId: 'helmet_skate_shell',
    type: 'helmet',
    slot: 'helmet',
    title: 'Skate Shell Helmet',
    description: 'Rounded low-profile skate helmet with chin straps.',
    rarity: 'common',
    colorMasks: ['primary', 'secondary'],
    asset2d: { layer: 'skate-shell-helmet' },
    asset3d: { primitive: 'skate-shell' },
    preview: { swatch: '#111827' },
    sortOrder: 53
  },
  {
    cosmeticId: 'helmet_bandana_laser',
    type: 'helmet',
    slot: 'helmet',
    title: 'Laser Moto Helmet',
    description: 'Full face moto helmet with hot-pink racing stripe.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { layer: 'laser-moto-helmet' },
    asset3d: { primitive: 'full-moto-helmet' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 54
  },
  {
    cosmeticId: 'helmet_moto_fullface',
    type: 'helmet',
    slot: 'helmet',
    title: 'Full-Face Moto Helmet',
    description: 'Street-racing full helmet with chin guard and dark visor.',
    rarity: 'common',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'full-face-moto-helmet' },
    asset3d: { primitive: 'full-face-moto' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 55
  },
  {
    cosmeticId: 'helmet_viper_hair',
    type: 'helmet',
    slot: 'helmet',
    title: 'Viper Pilot Helmet',
    description: 'Full pilot helmet with raised aerodynamic crest.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'viper-pilot-helmet' },
    asset3d: { primitive: 'full-pilot-helmet' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 56
  },
  {
    cosmeticId: 'helmet_football_cage',
    type: 'helmet',
    slot: 'helmet',
    title: 'Gridiron Cage Helmet',
    description: 'Football-style helmet with a protective neon face cage.',
    rarity: 'common',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'football-cage-helmet' },
    asset3d: { primitive: 'football-cage' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 57
  },
  {
    cosmeticId: 'helmet_tactical_visor',
    type: 'helmet',
    slot: 'helmet',
    title: 'Tactical Visor Helmet',
    description: 'Dual-sport tactical helmet with broad shield and cheek plates.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { layer: 'tactical-visor-helmet' },
    asset3d: { primitive: 'tactical-visor' },
    preview: { swatch: '#8B2CFF' },
    sortOrder: 58
  },
  {
    cosmeticId: 'helmet_open_face_rider',
    type: 'helmet',
    slot: 'helmet',
    title: 'Open-Face Rider Helmet',
    description: 'Retro open-face rider helmet with brim and chin strap.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'open-face-rider-helmet' },
    asset3d: { primitive: 'open-face-rider' },
    preview: { swatch: '#FFD400' },
    sortOrder: 59
  },
  {
    cosmeticId: 'helmet_champion_crown',
    type: 'helmet',
    slot: 'helmet',
    title: 'Champion Helmet',
    description: 'Full trophy helmet reserved for competitive events.',
    rarity: 'epic',
    colorMasks: ['accent'],
    asset2d: { layer: 'champion-helmet' },
    asset3d: { primitive: 'full-trophy-helmet' },
    unlockRule: { achievementId: 'rush_run_top_10' },
    sortOrder: 60
  },
  {
    cosmeticId: 'visor_clear',
    type: 'visor',
    slot: 'visor',
    title: 'Clear Visor',
    description: 'Minimal visor that keeps profile portraits readable.',
    rarity: 'common',
    asset2d: { layer: 'visor-clear' },
    asset3d: { primitive: 'visor-slab' },
    sortOrder: 70
  },
  {
    cosmeticId: 'visor_prism',
    type: 'visor',
    slot: 'visor',
    title: 'Prism Visor',
    description: 'Reflective visor for premium avatar looks.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'visor-prism' },
    asset3d: { primitive: 'visor-glass' },
    unlockRule: { xpRequired: 350 },
    sortOrder: 80
  },
  {
    cosmeticId: 'visor_shutter',
    type: 'visor',
    slot: 'visor',
    title: 'Shutter Shades',
    description: 'Classic neon shutter shades.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { layer: 'shutter-shades' },
    asset3d: { primitive: 'shutter-glasses' },
    preview: { swatch: '#FFD400' },
    sortOrder: 82
  },
  {
    cosmeticId: 'visor_mirrorwrap',
    type: 'visor',
    slot: 'visor',
    title: 'Mirror Wrap',
    description: 'Wraparound mirror visor for bike-gang and racer builds.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { layer: 'mirrorwrap' },
    asset3d: { primitive: 'wrap-glasses' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 84
  },
  {
    cosmeticId: 'visor_terminus',
    type: 'visor',
    slot: 'visor',
    title: 'Terminus Optics',
    description: 'Small red cyber optics for villain or android styles.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { layer: 'terminus-optics' },
    asset3d: { primitive: 'optic-slits' },
    preview: { swatch: '#FF4545' },
    sortOrder: 86
  },
  {
    cosmeticId: 'outfit_grid',
    type: 'outfit',
    slot: 'outfit',
    title: 'Grid Suit',
    description: 'Starter racing suit with color-mask support.',
    rarity: 'common',
    colorMasks: ['primary', 'secondary'],
    asset2d: { layer: 'grid-suit' },
    asset3d: { primitive: 'torso-panels' },
    sortOrder: 90
  },
  {
    cosmeticId: 'outfit_street_leather',
    type: 'outfit',
    slot: 'outfit',
    title: 'Street Leather',
    description: 'Black retro jacket with neon trim and rolled sleeves.',
    rarity: 'common',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'street-leather' },
    asset3d: { primitive: 'jacket-panels' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 92
  },
  {
    cosmeticId: 'outfit_laser_varsity',
    type: 'outfit',
    slot: 'outfit',
    title: 'Laser Varsity',
    description: 'Arcade varsity jacket with glowing chest panels.',
    rarity: 'common',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'varsity' },
    asset3d: { primitive: 'varsity-jacket' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 94
  },
  {
    cosmeticId: 'outfit_battle_harness',
    type: 'outfit',
    slot: 'outfit',
    title: 'Battle Harness',
    description: 'Action-movie torso harness over neon techwear.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { layer: 'battle-harness' },
    asset3d: { primitive: 'torso-harness' },
    preview: { swatch: '#8B2CFF' },
    sortOrder: 96
  },
  {
    cosmeticId: 'outfit_sunset_armor',
    type: 'outfit',
    slot: 'outfit',
    title: 'Sunset Armor',
    description: 'Segmented armor plates with hot-pink and gold highlights.',
    rarity: 'rare',
    colorMasks: ['primary', 'secondary', 'accent'],
    asset2d: { layer: 'sunset-armor' },
    asset3d: { primitive: 'armor-plates' },
    preview: { swatch: '#FFD400' },
    sortOrder: 98
  },
  {
    cosmeticId: 'outfit_founder_jacket',
    type: 'outfit',
    slot: 'outfit',
    title: 'Founder Jacket',
    description: 'Pilot-founder jacket for early Nexus Passport profiles.',
    rarity: 'founder',
    colorMasks: ['accent'],
    asset2d: { layer: 'founder-jacket' },
    asset3d: { primitive: 'jacket-shell' },
    unlockRule: { pilotOnly: true },
    sortOrder: 100
  },
  {
    cosmeticId: 'boots_grid_runners',
    type: 'boots',
    slot: 'boots',
    title: 'Grid Runners',
    description: 'Neon high-top sneakers for cabinet runner silhouettes.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { layer: 'grid-runners' },
    asset3d: { primitive: 'high-top-boots' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 102
  },
  {
    cosmeticId: 'boots_combat_neon',
    type: 'boots',
    slot: 'boots',
    title: 'Neon Combat Boots',
    description: 'Heavy action-hero boots with glowing laces.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { layer: 'combat-boots' },
    asset3d: { primitive: 'combat-boots' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 104
  },
  {
    cosmeticId: 'boots_hover_soles',
    type: 'boots',
    slot: 'boots',
    title: 'Hover Soles',
    description: 'Chunky future sneakers with floating light strips.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { layer: 'hover-soles' },
    asset3d: { primitive: 'hover-sneakers' },
    preview: { swatch: '#FFD400' },
    sortOrder: 106
  },
  {
    cosmeticId: 'boots_chrome_stompers',
    type: 'boots',
    slot: 'boots',
    title: 'Chrome Stompers',
    description: 'Chrome-plated arcade boss boots for broader body types.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { layer: 'chrome-stompers' },
    asset3d: { primitive: 'chrome-boots' },
    preview: { swatch: '#25FF9A' },
    sortOrder: 108
  },
  {
    cosmeticId: 'back_none',
    type: 'back',
    slot: 'back',
    title: 'No Back Gear',
    description: 'Clean silhouette for lightweight games.',
    rarity: 'common',
    asset2d: { layer: 'none' },
    asset3d: { primitive: 'none' },
    sortOrder: 110
  },
  {
    cosmeticId: 'back_boost_pack',
    type: 'back',
    slot: 'back',
    title: 'Boost Pack',
    description: 'Compact back add-on for speed-focused games.',
    rarity: 'rare',
    colorMasks: ['secondary', 'accent'],
    asset2d: { layer: 'boost-pack' },
    asset3d: { primitive: 'backpack-thrusters' },
    unlockRule: { xpRequired: 700 },
    sortOrder: 120
  },
  {
    cosmeticId: 'back_arcade_cape',
    type: 'back',
    slot: 'back',
    title: 'Arcade Cape',
    description: 'Short hero cape with a neon underside.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { layer: 'short-cape' },
    asset3d: { primitive: 'hero-cape' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 122
  },
  {
    cosmeticId: 'back_katana_pair',
    type: 'back',
    slot: 'back',
    title: 'Twin Katanas',
    description: 'Crossed arcade-action back accessory.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { layer: 'katana-pair' },
    asset3d: { primitive: 'crossed-katanas' },
    preview: { swatch: '#FFD400' },
    sortOrder: 124
  },
  {
    cosmeticId: 'back_boom_box',
    type: 'back',
    slot: 'back',
    title: 'Boombox Rig',
    description: 'Shoulder-mounted music rig for rhythm and street builds.',
    rarity: 'rare',
    colorMasks: ['primary'],
    asset2d: { layer: 'boombox' },
    asset3d: { primitive: 'boombox-backpack' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 126
  },
  {
    cosmeticId: 'trail_neon',
    type: 'trail',
    slot: 'trail',
    title: 'Neon Trail',
    description: 'Reusable motion trail for runners and racers.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { particle: 'line-trail' },
    asset3d: { particle: 'ribbon-trail' },
    sortOrder: 130
  },
  {
    cosmeticId: 'trail_comet',
    type: 'trail',
    slot: 'trail',
    title: 'Comet Trail',
    description: 'Longer particle trail for games with fast movement.',
    rarity: 'epic',
    colorMasks: ['accent'],
    asset2d: { particle: 'spark-trail' },
    asset3d: { particle: 'comet-ribbon' },
    unlockRule: { xpRequired: 1200 },
    sortOrder: 140
  },
  {
    cosmeticId: 'trail_laser_grid',
    type: 'trail',
    slot: 'trail',
    title: 'Laser Grid',
    description: 'Square-wave grid trail for fast cabinet games.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { particle: 'grid-trail' },
    asset3d: { particle: 'grid-ribbon' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 142
  },
  {
    cosmeticId: 'trail_fireline',
    type: 'trail',
    slot: 'trail',
    title: 'Fireline',
    description: 'Hot magenta-gold streak for high-score runs.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { particle: 'fireline' },
    asset3d: { particle: 'fireline-ribbon' },
    preview: { swatch: '#FFD400' },
    sortOrder: 144
  },
  {
    cosmeticId: 'aura_none',
    type: 'aura',
    slot: 'aura',
    title: 'No Aura',
    description: 'No ambient effect.',
    rarity: 'common',
    asset2d: { effect: 'none' },
    asset3d: { effect: 'none' },
    sortOrder: 150
  },
  {
    cosmeticId: 'aura_electric',
    type: 'aura',
    slot: 'aura',
    title: 'Electric Aura',
    description: 'Subtle pulsing aura for cabinet and profile previews.',
    rarity: 'rare',
    colorMasks: ['secondary'],
    asset2d: { effect: 'pulse-ring' },
    asset3d: { effect: 'halo-ring' },
    unlockRule: { xpRequired: 900 },
    sortOrder: 160
  },
  {
    cosmeticId: 'aura_sunset_ring',
    type: 'aura',
    slot: 'aura',
    title: 'Sunset Ring',
    description: 'Warm 80s halo ring for profile and win screens.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { effect: 'sunset-ring' },
    asset3d: { effect: 'sunset-halo' },
    preview: { swatch: '#FFD400' },
    sortOrder: 162
  },
  {
    cosmeticId: 'aura_outrun_scan',
    type: 'aura',
    slot: 'aura',
    title: 'Outrun Scan',
    description: 'Horizontal scanline glow behind the avatar.',
    rarity: 'rare',
    colorMasks: ['primary', 'secondary'],
    asset2d: { effect: 'scanlines' },
    asset3d: { effect: 'scanline-plane' },
    preview: { swatch: '#00E5FF' },
    sortOrder: 164
  },
  {
    cosmeticId: 'frame_neon_start',
    type: 'frame',
    slot: 'frame',
    title: 'Neon Start Frame',
    description: 'Starter portrait frame for cabinet cards.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { frame: 'rounded-neon' },
    asset3d: { frame: 'none' },
    sortOrder: 170
  },
  {
    cosmeticId: 'frame_laser_chrome',
    type: 'frame',
    slot: 'frame',
    title: 'Laser Chrome Frame',
    description: 'Chrome portrait border for high-contrast cabinet cards.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { frame: 'laser-chrome' },
    asset3d: { frame: 'none' },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 172
  },
  {
    cosmeticId: 'frame_sunset_grid',
    type: 'frame',
    slot: 'frame',
    title: 'Sunset Grid Frame',
    description: 'Warm 80s grid frame for profile and leaderboard portraits.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { frame: 'sunset-grid' },
    asset3d: { frame: 'none' },
    preview: { swatch: '#FFD400' },
    sortOrder: 174
  },
  {
    cosmeticId: 'frame_vector_vip',
    type: 'frame',
    slot: 'frame',
    title: 'Vector VIP Frame',
    description: 'Premium angular frame with green-blue neon corners.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { frame: 'vector-vip' },
    asset3d: { frame: 'none' },
    preview: { swatch: '#25FF9A' },
    sortOrder: 176
  },
  {
    cosmeticId: 'badge_rookie',
    type: 'badge',
    slot: 'badge',
    title: 'Rookie Badge',
    description: 'First Passport badge.',
    rarity: 'common',
    asset2d: { icon: 'rookie' },
    asset3d: { decal: 'rookie' },
    sortOrder: 180
  },
  {
    cosmeticId: 'pose_idle',
    type: 'pose',
    slot: 'pose',
    title: 'Ready Pose',
    description: 'Neutral pose for game-safe profile rendering.',
    rarity: 'common',
    asset2d: { pose: 'idle' },
    asset3d: { pose: 'idle' },
    sortOrder: 190
  },
  {
    cosmeticId: 'pose_victory',
    type: 'pose',
    slot: 'pose',
    title: 'Victory Pose',
    description: 'Celebration pose shown after saved scores.',
    rarity: 'rare',
    asset2d: { pose: 'victory' },
    asset3d: { pose: 'victory' },
    unlockRule: { achievementId: 'first_saved_score' },
    sortOrder: 200
  },
  {
    cosmeticId: 'pose_power',
    type: 'pose',
    slot: 'pose',
    title: 'Power Stance',
    description: 'Hero stance with broader shoulders and planted feet.',
    rarity: 'common',
    asset2d: { pose: 'power' },
    asset3d: { pose: 'power' },
    sortOrder: 202
  },
  {
    cosmeticId: 'pose_street',
    type: 'pose',
    slot: 'pose',
    title: 'Street Lean',
    description: 'Relaxed profile pose for rebel and street builds.',
    rarity: 'common',
    asset2d: { pose: 'street' },
    asset3d: { pose: 'street' },
    sortOrder: 204
  },
  {
    cosmeticId: 'emote_wave',
    type: 'emote',
    slot: 'emote',
    title: 'Neon Wave',
    description: 'Friendly greeting emote for returning-player and cabinet welcome moments.',
    rarity: 'common',
    colorMasks: ['secondary'],
    asset2d: { emote: 'wave' },
    asset3d: { emote: 'wave', triggers: ['manual', 'cabinet.greeting'] },
    preview: { swatch: '#FF2ED1' },
    sortOrder: 210
  },
  {
    cosmeticId: 'emote_power_flex',
    type: 'emote',
    slot: 'emote',
    title: 'Power Flex',
    description: 'Score-screen flex for wins, personal bests, and challenge clears.',
    rarity: 'common',
    colorMasks: ['accent'],
    asset2d: { emote: 'power-flex' },
    asset3d: { emote: 'power-flex', triggers: ['manual', 'score.personal_best'] },
    preview: { swatch: '#FFD400' },
    sortOrder: 212
  },
  {
    cosmeticId: 'emote_air_guitar',
    type: 'emote',
    slot: 'emote',
    title: 'Air Guitar',
    description: 'Arcade victory emote with a neon guitar prop.',
    rarity: 'common',
    colorMasks: ['primary', 'secondary'],
    asset2d: { emote: 'air-guitar' },
    asset3d: { emote: 'air-guitar', triggers: ['manual', 'game.victory'] },
    preview: { swatch: '#00E5FF' },
    sortOrder: 214
  },
  {
    cosmeticId: 'emote_dance_break',
    type: 'emote',
    slot: 'emote',
    title: 'Dance Break',
    description: 'Loopable celebratory dance for lobby and attract moments.',
    rarity: 'rare',
    colorMasks: ['primary', 'accent'],
    asset2d: { emote: 'dance-break' },
    asset3d: { emote: 'dance-break', triggers: ['manual', 'lobby.idle'] },
    preview: { swatch: '#25FF9A' },
    sortOrder: 216
  },
  {
    cosmeticId: 'emote_high_score',
    type: 'emote',
    slot: 'emote',
    title: 'High Score Pop',
    description: 'Leaderboard celebration with a neon star pop.',
    rarity: 'rare',
    colorMasks: ['accent'],
    asset2d: { emote: 'high-score-pop' },
    asset3d: { emote: 'high-score-pop', triggers: ['manual', 'leaderboard.top_ten'] },
    preview: { swatch: '#8B2CFF' },
    sortOrder: 218
  },
  {
    cosmeticId: 'emote_thumbs_up',
    type: 'emote',
    slot: 'emote',
    title: 'Thumbs Up',
    description: 'Quick positive emote for co-op ready checks and game-end screens.',
    rarity: 'common',
    colorMasks: ['primary'],
    asset2d: { emote: 'thumbs-up' },
    asset3d: { emote: 'thumbs-up', triggers: ['manual', 'coop.ready'] },
    preview: { swatch: '#00E5FF' },
    sortOrder: 220
  }
].map((item) => CosmeticCatalogItemSchema.parse(item)));

const lockedCosmeticIds = new Set(['helmet_champion_crown']);
const starterCosmeticIds = new Set(
  avatarCatalogItems
    .filter((item) => !lockedCosmeticIds.has(item.cosmeticId))
    .map((item) => item.cosmeticId)
);

const avatarFieldBySlot = Object.freeze({
  body: 'bodyId',
  head: 'headId',
  hair: 'hairId',
  helmet: 'helmetId',
  visor: 'visorId',
  outfit: 'outfitId',
  boots: 'bootsId',
  back: 'backId',
  trail: 'trailId',
  aura: 'auraId',
  frame: 'frameId',
  badge: 'badgeId',
  pose: 'poseId',
  emote: 'emoteId'
});

const bodyTypeByCosmeticId = Object.freeze({
  body_neon_hero: 'hero',
  body_runner_core: 'runner',
  body_street_legend: 'street',
  body_synth_athlete: 'runner',
  body_android_prime: 'android',
  body_guardian_frame: 'guardian'
});

function avatarValueForSlot(slot, cosmeticId) {
  if (slot === 'badge') {
    return cosmeticId.replace(/^badge_/, '');
  }
  if (slot === 'pose') {
    return cosmeticId.replace(/^pose_/, '');
  }
  if (slot === 'emote') {
    return cosmeticId;
  }
  return cosmeticId;
}

export function defaultEquippedFromAvatar(avatarInput = defaultAvatar) {
  const avatar = AvatarManifestSchema.parse(avatarInput);
  return {
    body: avatar.bodyId,
    head: avatar.headId,
    hair: avatar.hairId,
    helmet: avatar.helmetId,
    visor: avatar.visorId,
    outfit: avatar.outfitId,
    boots: avatar.bootsId,
    back: avatar.backId,
    trail: avatar.trailId,
    aura: avatar.auraId,
    frame: avatar.frameId,
    badge: `badge_${avatar.badgeId}`,
    pose: `pose_${avatar.poseId}`,
    emote: avatar.emoteId
  };
}

function mapToPlainObject(value) {
  if (!value) {
    return {};
  }
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return Object.fromEntries(Object.entries(value));
}

export async function ensureStarterCosmetics() {
  await Promise.all(avatarCatalogItems.map((item) => CosmeticItem.updateOne(
    { cosmeticId: item.cosmeticId },
    { $set: item },
    { upsert: true }
  )));
}

export async function ensurePlayerInventory(playerId, avatarInput = defaultAvatar) {
  await ensureStarterCosmetics();
  const defaultEquipped = defaultEquippedFromAvatar(avatarInput);
  const starterCosmetics = avatarCatalogItems
    .filter((item) => starterCosmeticIds.has(item.cosmeticId))
    .map((item) => ({
      cosmeticId: item.cosmeticId,
      slot: item.slot,
      source: 'starter'
    }));

  let inventory = await PlayerInventory.findOne({ playerId });
  if (!inventory) {
    return PlayerInventory.create({
      playerId,
      cosmetics: starterCosmetics,
      badges: [{ badgeId: defaultAvatar.badgeId }],
      equipped: defaultEquipped
    });
  }

  const ownedIds = new Set(inventory.cosmetics.map((item) => item.cosmeticId));
  for (const item of starterCosmetics) {
    if (!ownedIds.has(item.cosmeticId)) {
      inventory.cosmetics.push(item);
    }
  }

  const equipped = {
    ...defaultEquipped,
    ...mapToPlainObject(inventory.equipped)
  };
  inventory.equipped = equipped;
  await inventory.save();
  return inventory;
}

export async function getAvatarCatalog() {
  await ensureStarterCosmetics();
  const items = await CosmeticItem.find({ active: true }).sort({ sortOrder: 1, title: 1 }).lean();
  return { items };
}

export async function getPlayerAvatarInventory(playerId) {
  const profile = await PlayerProfile.findById(playerId);
  if (!profile) {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }

  const inventory = await ensurePlayerInventory(playerId, profile.avatar || defaultAvatar);
  return PlayerAvatarInventorySchema.parse({
    playerId: String(playerId),
    cosmetics: inventory.cosmetics.map((item) => ({
      cosmeticId: item.cosmeticId,
      slot: item.slot,
      source: item.source,
      unlockedAt: item.unlockedAt?.toISOString()
    })),
    badges: inventory.badges.map((badge) => ({
      badgeId: badge.badgeId,
      unlockedAt: badge.unlockedAt?.toISOString()
    })),
    equipped: mapToPlainObject(inventory.equipped),
    unlocks: inventory.unlocks || {}
  });
}

export async function equipPlayerCosmetic(playerId, { slot, cosmeticId }) {
  const parsedSlot = AvatarEquipmentSlotSchema.parse(slot);
  const catalogItem = await CosmeticItem.findOne({ cosmeticId, active: true });
  if (!catalogItem || catalogItem.slot !== parsedSlot) {
    const error = new Error('Cosmetic is not available for that avatar slot');
    error.statusCode = 400;
    throw error;
  }

  const inventory = await ensurePlayerInventory(playerId);
  const owned = inventory.cosmetics.some((item) => item.cosmeticId === cosmeticId);
  if (!owned) {
    const error = new Error('Cosmetic is locked for this player');
    error.statusCode = 403;
    throw error;
  }

  const profile = await PlayerProfile.findById(playerId);
  if (!profile) {
    const error = new Error('Player profile not found');
    error.statusCode = 404;
    throw error;
  }

  const equipped = {
    ...mapToPlainObject(inventory.equipped),
    [parsedSlot]: cosmeticId
  };
  inventory.equipped = equipped;

  const nextAvatar = AvatarManifestSchema.parse({
    ...(profile.avatar?.toObject?.() || profile.avatar || defaultAvatar),
    [avatarFieldBySlot[parsedSlot]]: avatarValueForSlot(parsedSlot, cosmeticId)
  });
  if (parsedSlot === 'body') {
    nextAvatar.bodyType = bodyTypeByCosmeticId[cosmeticId] || 'hero';
  }
  profile.avatar = nextAvatar;

  await Promise.all([inventory.save(), profile.save()]);
  return {
    profile,
    inventory: await getPlayerAvatarInventory(playerId)
  };
}
