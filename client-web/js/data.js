// Seeded PRNG for deterministic procedural generation
function SeededRandom(seed) {
  this.seed = seed;
}
SeededRandom.prototype.next = function() {
  this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
  return this.seed / 0x7fffffff;
};
SeededRandom.prototype.nextInt = function(min, max) {
  return Math.floor(this.next() * (max - min + 1)) + min;
};
SeededRandom.prototype.shuffle = function(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = this.nextInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function generateTileData(w, h, seedStr, connectionPoints, density) {
  density = density || 0.05;
  const rng = new SeededRandom(hashStr(seedStr));
  const grid = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = 0;
    }
  }
  // border
  for (let x = 0; x < w; x++) {
    grid[0][x] = 1;
    grid[h - 1][x] = 1;
  }
  for (let y = 0; y < h; y++) {
    grid[y][0] = 1;
    grid[y][w - 1] = 1;
  }
  // interior pillars
  const numPillars = Math.floor(w * h * 0.008);
  for (let i = 0; i < numPillars; i++) {
    const x = rng.nextInt(2, w - 3);
    const y = rng.nextInt(2, h - 3);
    grid[y][x] = 1;
  }
  // wall segments
  const numSeg = Math.floor(w * h / 600);
  for (let i = 0; i < numSeg; i++) {
    const sx = rng.nextInt(2, w - 5);
    const sy = rng.nextInt(2, h - 5);
    const length = rng.nextInt(2, 4);
    const horiz = rng.next() > 0.5;
    for (let j = 0; j < length; j++) {
      const nx = sx + (horiz ? j : 0);
      const ny = sy + (horiz ? 0 : j);
      if (nx > 1 && nx < w - 2 && ny > 1 && ny < h - 2) {
        grid[ny][nx] = 1;
      }
    }
  }
  // 2x2 blocks
  const numBlk = Math.floor(w * h / 1000);
  for (let i = 0; i < numBlk; i++) {
    const bx = rng.nextInt(2, w - 4);
    const by = rng.nextInt(2, h - 4);
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        grid[by + dy][bx + dx] = 1;
      }
    }
  }
  // clear connection points
  if (connectionPoints) {
    for (const cp of connectionPoints) {
      const [cx, cy] = cp;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ny = cy + dy;
          const nx = cx + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            grid[ny][nx] = 0;
          }
        }
      }
    }
  }
  // clear spawn areas
  const spawnCenters = [
    [Math.floor(h / 2), Math.floor(w / 2)],
    [Math.floor(h / 4), Math.floor(w / 4)],
    [Math.floor(3 * h / 4), Math.floor(3 * w / 4)],
    [Math.floor(h / 4), Math.floor(3 * w / 4)],
    [Math.floor(3 * h / 4), Math.floor(w / 4)]
  ];
  for (const [cy, cx] of spawnCenters) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const ny = cy + dy;
        const nx = cx + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
          if (rng.next() > 0.1) {
            grid[ny][nx] = 0;
          }
        }
      }
    }
  }
  return grid;
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

function distributeSpawns(grid, monsterId, count, seed, nearCenter) {
  const h = grid.length;
  const w = grid[0].length;
  const rng = new SeededRandom(hashStr(seed) + hashStr(monsterId));
  const cx = nearCenter ? nearCenter[0] : Math.floor(w / 2);
  const cy = nearCenter ? nearCenter[1] : Math.floor(h / 2);
  const spawns = [];
  let attempts = 0;
  while (spawns.length < count && attempts < 1000) {
    const x = rng.nextInt(Math.max(1, cx - 20), Math.min(w - 2, cx + 20));
    const y = rng.nextInt(Math.max(1, cy - 20), Math.min(h - 2, cy + 20));
    if (grid[y] && grid[y][x] === 0) {
      spawns.push({ monsterId: monsterId, x: x, y: y, count: 1 });
    }
    attempts++;
  }
  while (spawns.length < count) {
    const x = rng.nextInt(1, w - 2);
    const y = rng.nextInt(1, h - 2);
    if (grid[y] && grid[y][x] === 0) {
      spawns.push({ monsterId: monsterId, x: x, y: y, count: 1 });
    }
  }
  return spawns.slice(0, count);
}

const GameData = {
  classes: {
    dark_knight: {
      id: 'dark_knight',
      name: 'Dark Knight',
      baseStats: { str: 28, agi: 20, vit: 25, ene: 10 },
      pointsPerLevel: 5,
      skillsAtLevels: [
        { level: 1, skillId: 'normal_attack' },
        { level: 30, skillId: 'twisting_slash' },
        { level: 80, skillId: 'impale' },
        { level: 120, skillId: 'swell_life' },
        { level: 160, skillId: 'death_stab' },
        { level: 170, skillId: 'rageful_blow' },
        { level: 220, skillId: 'strike_of_destruction' }
      ],
      startingMap: 'lorencia',
      startingX: 130,
      startingY: 140
    },
    elf: {
      id: 'elf',
      name: 'Elf',
      baseStats: { str: 22, agi: 25, vit: 20, ene: 15 },
      pointsPerLevel: 5,
      skillsAtLevels: [
        { level: 1, skillId: 'elf_normal_attack' },
        { level: 22, skillId: 'summon_goblin' },
        { level: 30, skillId: 'penetration' },
        { level: 56, skillId: 'heal' },
        { level: 80, skillId: 'greater_damage' },
        { level: 80, skillId: 'greater_defense' },
        { level: 92, skillId: 'ice_arrow' },
        { level: 150, skillId: 'triple_shot' }
      ],
      startingMap: 'noria',
      startingX: 175,
      startingY: 125
    },
    mago: {
      id: 'mago',
      name: 'Mago',
      baseStats: { str: 18, agi: 18, vit: 15, ene: 30 },
      pointsPerLevel: 5,
      skillsAtLevels: [
        { level: 1, skillId: 'fire_ball' },
        { level: 7, skillId: 'power_wave' },
        { level: 13, skillId: 'lightning' },
        { level: 17, skillId: 'teleport' },
        { level: 21, skillId: 'meteorite' },
        { level: 25, skillId: 'ice' },
        { level: 30, skillId: 'poison' },
        { level: 34, skillId: 'flame' },
        { level: 38, skillId: 'twister' },
        { level: 42, skillId: 'hellfire' },
        { level: 60, skillId: 'aqua_beam' },
        { level: 70, skillId: 'cometfall' },
        { level: 80, skillId: 'inferno' },
        { level: 90, skillId: 'evil_spirit' },
        { level: 220, skillId: 'nova' }
      ],
      startingMap: 'lorencia',
      startingX: 130,
      startingY: 140
    }
  },

  monsters: {
    // LORENCIA
    spider: { id: 'spider', name: 'Araña', level: 2, hp: 40, atkMin: 6, atkMax: 8, defense: 1, atkRate: 8, defRate: 1, xp: 5, aggroRange: 3, attackRange: 1, moveSpeed: 2, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'small_hp_potion', chance: 0.35 }, { itemId: 'arrows', chance: 0.15 }] },
    budge_dragon: { id: 'budge_dragon', name: 'Dragón Pequeño', level: 4, hp: 80, atkMin: 12, atkMax: 17, defense: 3, atkRate: 18, defRate: 3, xp: 15, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'small_hp_potion', chance: 0.3 }, { itemId: 'small_mp_potion', chance: 0.15 }, { itemId: 'arrows', chance: 0.1 }] },
    bull_fighter: { id: 'bull_fighter', name: 'Toro Luchador', level: 6, hp: 120, atkMin: 19, atkMax: 26, defense: 6, atkRate: 28, defRate: 6, xp: 30, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'small_hp_potion', chance: 0.25 }, { itemId: 'hp_potion', chance: 0.15 }, { itemId: 'short_sword', chance: 0.02 }, { itemId: 'short_bow', chance: 0.02 }] },
    hound: { id: 'hound', name: 'Sabueso', level: 9, hp: 160, atkMin: 25, atkMax: 35, defense: 9, atkRate: 40, defRate: 9, xp: 55, aggroRange: 6, attackRange: 1.5, moveSpeed: 3, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'small_mp_potion', chance: 0.2 }, { itemId: 'blade', chance: 0.02 }, { itemId: 'bow', chance: 0.02 }] },
    elite_bull_fighter: { id: 'elite_bull_fighter', name: 'Toro Élite', level: 12, hp: 220, atkMin: 35, atkMax: 44, defense: 12, atkRate: 50, defRate: 12, xp: 90, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'hp_potion', chance: 0.25 }, { itemId: 'mp_potion', chance: 0.15 }, { itemId: 'gladius', chance: 0.03 }, { itemId: 'skull_staff', chance: 0.02 }] },
    giant: { id: 'giant', name: 'Gigante', level: 17, hp: 400, atkMin: 57, atkMax: 62, defense: 17, atkRate: 80, defRate: 17, xp: 180, aggroRange: 5, attackRange: 2.0, moveSpeed: 2, respawnTime: 15, mapId: 'lorencia', drops: [{ itemId: 'hp_potion', chance: 0.25 }, { itemId: 'mp_potion', chance: 0.2 }, { itemId: 'falchion', chance: 0.03 }, { itemId: 'leather_armor', chance: 0.03 }] },
    // NORIA
    goblin: { id: 'goblin', name: 'Goblin', level: 3, hp: 60, atkMin: 9, atkMax: 12, defense: 2, atkRate: 12, defRate: 2, xp: 10, aggroRange: 4, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'small_hp_potion', chance: 0.35 }, { itemId: 'arrows', chance: 0.15 }] },
    chain_scorpion: { id: 'chain_scorpion', name: 'Escorpión de Cadena', level: 5, hp: 100, atkMin: 15, atkMax: 20, defense: 4, atkRate: 22, defRate: 4, xp: 20, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'small_hp_potion', chance: 0.3 }, { itemId: 'small_mp_potion', chance: 0.15 }] },
    elite_goblin: { id: 'elite_goblin', name: 'Goblin Élite', level: 8, hp: 140, atkMin: 22, atkMax: 30, defense: 7, atkRate: 35, defRate: 7, xp: 45, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'small_hp_potion', chance: 0.2 }, { itemId: 'hp_potion', chance: 0.15 }, { itemId: 'short_bow', chance: 0.02 }] },
    beetle_monster: { id: 'beetle_monster', name: 'Escarabajo', level: 10, hp: 180, atkMin: 28, atkMax: 38, defense: 10, atkRate: 45, defRate: 10, xp: 70, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'gladius', chance: 0.03 }, { itemId: 'leather_armor', chance: 0.02 }] },
    stone_golem: { id: 'stone_golem', name: 'Gólem de Piedra', level: 19, hp: 500, atkMin: 65, atkMax: 75, defense: 19, atkRate: 85, defRate: 19, xp: 210, aggroRange: 4, attackRange: 2.0, moveSpeed: 1, respawnTime: 20, mapId: 'noria', drops: [{ itemId: 'hp_potion', chance: 0.25 }, { itemId: 'mp_potion', chance: 0.2 }, { itemId: 'falchion', chance: 0.03 }, { itemId: 'scale_armor', chance: 0.02 }] },
    agon: { id: 'agon', name: 'Agon', level: 16, hp: 340, atkMin: 50, atkMax: 58, defense: 16, atkRate: 75, defRate: 16, xp: 160, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'mp_potion', chance: 0.15 }, { itemId: 'double_axe', chance: 0.03 }] },
    forest_monster: { id: 'forest_monster', name: 'Monstruo del Bosque', level: 15, hp: 300, atkMin: 48, atkMax: 55, defense: 15, atkRate: 70, defRate: 15, xp: 140, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'noria', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'long_bow', chance: 0.03 }, { itemId: 'vine_armor', chance: 0.03 }] },
    // DAVIAS
    ice_monster: { id: 'ice_monster', name: 'Monstruo de Hielo', level: 22, hp: 700, atkMin: 85, atkMax: 95, defense: 24, atkRate: 100, defRate: 24, xp: 300, aggroRange: 6, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'davias', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'mp_potion', chance: 0.2 }, { itemId: 'scale_armor', chance: 0.02 }] },
    hommerd: { id: 'hommerd', name: 'Hommerd', level: 24, hp: 800, atkMin: 95, atkMax: 105, defense: 28, atkRate: 110, defRate: 28, xp: 370, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'davias', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'mp_potion', chance: 0.15 }, { itemId: 'serpent_staff', chance: 0.02 }] },
    yeti: { id: 'yeti', name: 'Yeti', level: 30, hp: 1000, atkMin: 110, atkMax: 115, defense: 38, atkRate: 130, defRate: 38, xp: 550, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'davias', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.15 }, { itemId: 'scimitar', chance: 0.03 }] },
    assassin: { id: 'assassin', name: 'Asesino', level: 33, hp: 1100, atkMin: 115, atkMax: 120, defense: 42, atkRate: 140, defRate: 42, xp: 650, aggroRange: 7, attackRange: 6, moveSpeed: 3, respawnTime: 15, mapId: 'davias', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'crossbow', chance: 0.03 }, { itemId: 'brass_armor', chance: 0.02 }] },
    elite_yeti: { id: 'elite_yeti', name: 'Yeti Élite', level: 36, hp: 1200, atkMin: 120, atkMax: 125, defense: 58, atkRate: 150, defRate: 58, xp: 750, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'davias', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.15 }, { itemId: 'thunder_staff', chance: 0.03 }] },
    ice_queen: { id: 'ice_queen', name: 'Reina del Hielo', level: 38, hp: 1400, atkMin: 130, atkMax: 138, defense: 58, atkRate: 160, defRate: 58, xp: 850, aggroRange: 6, attackRange: 4, moveSpeed: 2, respawnTime: 20, mapId: 'davias', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'jewel_of_soul', chance: 0.02 }, { itemId: 'legendary_staff', chance: 0.02 }] },
    // DUNGEON
    ghost: { id: 'ghost', name: 'Fantasma', level: 20, hp: 600, atkMin: 70, atkMax: 80, defense: 20, atkRate: 90, defRate: 20, xp: 240, aggroRange: 4, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_1', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'mp_potion', chance: 0.15 }] },
    larva: { id: 'larva', name: 'Larva', level: 21, hp: 650, atkMin: 72, atkMax: 82, defense: 22, atkRate: 95, defRate: 22, xp: 260, aggroRange: 4, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_1', drops: [{ itemId: 'hp_potion', chance: 0.2 }, { itemId: 'mp_potion', chance: 0.15 }] },
    skeleton_warrior: { id: 'skeleton_warrior', name: 'Guerrero Esqueleto', level: 23, hp: 750, atkMin: 88, atkMax: 98, defense: 25, atkRate: 105, defRate: 25, xp: 320, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_1', drops: [{ itemId: 'large_hp_potion', chance: 0.15 }, { itemId: 'mp_potion', chance: 0.2 }, { itemId: 'scimitar', chance: 0.03 }] },
    cyclops: { id: 'cyclops', name: 'Cíclope', level: 28, hp: 950, atkMin: 105, atkMax: 112, defense: 33, atkRate: 125, defRate: 33, xp: 470, aggroRange: 5, attackRange: 2.0, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_1', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.1 }, { itemId: 'scale_armor', chance: 0.03 }] },
    skeleton_archer: { id: 'skeleton_archer', name: 'Arquero Esqueleto', level: 30, hp: 1000, atkMin: 110, atkMax: 115, defense: 38, atkRate: 130, defRate: 38, xp: 550, aggroRange: 7, attackRange: 6, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_2', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.15 }, { itemId: 'crossbow', chance: 0.03 }] },
    hell_spider: { id: 'hell_spider', name: 'Araña Infernal', level: 38, hp: 1400, atkMin: 128, atkMax: 138, defense: 58, atkRate: 155, defRate: 58, xp: 820, aggroRange: 5, attackRange: 1.5, moveSpeed: 3, respawnTime: 15, mapId: 'dungeon_2', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.15 }, { itemId: 'brass_armor', chance: 0.03 }] },
    hell_hound: { id: 'hell_hound', name: 'Sabueso Infernal', level: 40, hp: 1600, atkMin: 135, atkMax: 142, defense: 64, atkRate: 170, defRate: 64, xp: 920, aggroRange: 6, attackRange: 1.5, moveSpeed: 3, respawnTime: 15, mapId: 'dungeon_2', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'dragon_armor', chance: 0.02 }] },
    poison_bull: { id: 'poison_bull', name: 'Toro Venenoso', level: 46, hp: 2500, atkMin: 145, atkMax: 150, defense: 75, atkRate: 190, defRate: 75, xp: 1200, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_3', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'blade_of_destruction', chance: 0.02 }] },
    dark_knight_mob: { id: 'dark_knight_mob', name: 'Caballero Oscuro', level: 48, hp: 3000, atkMin: 150, atkMax: 155, defense: 80, atkRate: 200, defRate: 80, xp: 1350, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'dungeon_3', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'excalibur', chance: 0.02 }] },
    gorgon: { id: 'gorgon', name: 'Gorgona', level: 55, hp: 6000, atkMin: 165, atkMax: 175, defense: 100, atkRate: 220, defRate: 100, xp: 2200, aggroRange: 8, attackRange: 2.5, moveSpeed: 1, respawnTime: 30, mapId: 'dungeon_3', boss: true, drops: [{ itemId: 'jewel_of_bless', chance: 0.05 }, { itemId: 'jewel_of_soul', chance: 0.08 }, { itemId: 'dark_breaker', chance: 0.03 }, { itemId: 'dragon_armor', chance: 0.03 }, { itemId: 'large_hp_potion', chance: 0.3 }] },
    // LOST TOWER
    shadow: { id: 'shadow', name: 'Sombra', level: 47, hp: 2800, atkMin: 148, atkMax: 153, defense: 78, atkRate: 195, defRate: 78, xp: 1350, aggroRange: 5, attackRange: 1.5, moveSpeed: 3, respawnTime: 15, mapId: 'losttower_1', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.15 }] },
    poison_shadow: { id: 'poison_shadow', name: 'Sombra Venenosa', level: 50, hp: 3500, atkMin: 155, atkMax: 160, defense: 85, atkRate: 210, defRate: 85, xp: 1550, aggroRange: 5, attackRange: 1.5, moveSpeed: 3, respawnTime: 15, mapId: 'losttower_2', drops: [{ itemId: 'large_hp_potion', chance: 0.2 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'gorgon_staff', chance: 0.02 }] },
    cursed_wizard: { id: 'cursed_wizard', name: 'Mago Maldito', level: 54, hp: 4000, atkMin: 160, atkMax: 170, defense: 95, atkRate: 215, defRate: 95, xp: 1800, aggroRange: 6, attackRange: 5, moveSpeed: 2, respawnTime: 15, mapId: 'losttower_2', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'resurrection_staff', chance: 0.02 }] },
    death_cow: { id: 'death_cow', name: 'Vaca Mortal', level: 57, hp: 4500, atkMin: 170, atkMax: 180, defense: 110, atkRate: 225, defRate: 110, xp: 2000, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'losttower_3', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'legendary_staff', chance: 0.02 }] },
    devil: { id: 'devil', name: 'Diablo', level: 60, hp: 5000, atkMin: 180, atkMax: 195, defense: 115, atkRate: 240, defRate: 115, xp: 2400, aggroRange: 6, attackRange: 2.0, moveSpeed: 3, respawnTime: 15, mapId: 'losttower_4', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'dark_breaker', chance: 0.02 }] },
    death_knight_mob: { id: 'death_knight_mob', name: 'Caballero de la Muerte', level: 62, hp: 5500, atkMin: 190, atkMax: 200, defense: 120, atkRate: 250, defRate: 120, xp: 2600, aggroRange: 5, attackRange: 1.5, moveSpeed: 2, respawnTime: 15, mapId: 'losttower_5', drops: [{ itemId: 'large_hp_potion', chance: 0.25 }, { itemId: 'large_mp_potion', chance: 0.2 }, { itemId: 'excalibur', chance: 0.02 }] },
    balrog: { id: 'balrog', name: 'Balrog', level: 67, hp: 7000, atkMin: 210, atkMax: 225, defense: 135, atkRate: 280, defRate: 135, xp: 3400, aggroRange: 8, attackRange: 2.5, moveSpeed: 1, respawnTime: 30, mapId: 'losttower_7', boss: true, drops: [{ itemId: 'jewel_of_bless', chance: 0.06 }, { itemId: 'jewel_of_soul', chance: 0.08 }, { itemId: 'jewel_of_chaos', chance: 0.04 }, { itemId: 'dark_breaker', chance: 0.03 }, { itemId: 'dragon_armor', chance: 0.03 }, { itemId: 'large_hp_potion', chance: 0.3 }] }
  },

  items: [
    // DK WEAPONS
    { id: 'short_sword', name: 'Espada Corta', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 15, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 6, attackMax: 12, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 200, luck: false, moveSpeed: 0 },
    { id: 'blade', name: 'Cuchilla', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 40, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 12, attackMax: 20, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 800, luck: false, moveSpeed: 0 },
    { id: 'gladius', name: 'Gladius', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 75, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 20, attackMax: 32, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 2500, luck: false, moveSpeed: 0 },
    { id: 'falchion', name: 'Falcata', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 120, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 30, attackMax: 45, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 6000, luck: false, moveSpeed: 0 },
    { id: 'double_axe', name: 'Hacha Doble', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 160, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 40, attackMax: 55, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 12000, luck: false, moveSpeed: 0 },
    { id: 'scimitar', name: 'Cimitarra', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 220, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 50, attackMax: 70, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 25000, luck: false, moveSpeed: 0 },
    { id: 'blade_of_destruction', name: 'Cuchilla de Destrucci\u00f3n', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 300, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 65, attackMax: 85, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 50000, luck: false, moveSpeed: 0 },
    { id: 'excalibur', name: 'Excalibur', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 380, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 78, attackMax: 100, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 100000, luck: false, moveSpeed: 0 },
    { id: 'dark_breaker', name: 'Rompe Tinieblas', type: 'weapon', classRestriction: 'dk', slot: 'weapon', levelReq: 0, reqStr: 480, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 95, attackMax: 125, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 200000, luck: false, moveSpeed: 0 },
    // ELF WEAPONS
    { id: 'short_bow', name: 'Arco Corto', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 15, reqVit: 0, reqEne: 0, attackMin: 5, attackMax: 10, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 200, luck: false, moveSpeed: 0 },
    { id: 'bow', name: 'Arco', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 40, reqVit: 0, reqEne: 0, attackMin: 10, attackMax: 18, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 800, luck: false, moveSpeed: 0 },
    { id: 'elven_bow', name: 'Arco \u00c9lfico', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 80, reqVit: 0, reqEne: 0, attackMin: 18, attackMax: 30, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 3000, luck: false, moveSpeed: 0 },
    { id: 'long_bow', name: 'Arco Largo', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 120, reqVit: 0, reqEne: 0, attackMin: 28, attackMax: 42, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 7000, luck: false, moveSpeed: 0 },
    { id: 'crossbow', name: 'Ballesta', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 160, reqVit: 0, reqEne: 0, attackMin: 35, attackMax: 50, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 14000, luck: false, moveSpeed: 0 },
    { id: 'golden_crossbow', name: 'Ballesta Dorada', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 220, reqVit: 0, reqEne: 0, attackMin: 45, attackMax: 65, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 30000, luck: false, moveSpeed: 0 },
    { id: 'arquebus', name: 'Arcabuz', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 300, reqVit: 0, reqEne: 0, attackMin: 60, attackMax: 80, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 60000, luck: false, moveSpeed: 0 },
    { id: 'balista', name: 'Balista', type: 'weapon', classRestriction: 'elf', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 380, reqVit: 0, reqEne: 0, attackMin: 72, attackMax: 95, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 120000, luck: false, moveSpeed: 0 },
    // MAGO WEAPONS
    { id: 'skull_staff', name: 'B\u00e1culo de Calavera', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 20, attackMin: 4, attackMax: 8, defense: 0, wizRaise: 0.10, hpRestore: 0, mpRestore: 0, value: 300, luck: false, moveSpeed: 0 },
    { id: 'angelic_staff', name: 'B\u00e1culo Ang\u00e9lico', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 50, attackMin: 8, attackMax: 15, defense: 0, wizRaise: 0.18, hpRestore: 0, mpRestore: 0, value: 1200, luck: false, moveSpeed: 0 },
    { id: 'serpent_staff', name: 'B\u00e1culo de Serpiente', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 90, attackMin: 15, attackMax: 25, defense: 0, wizRaise: 0.28, hpRestore: 0, mpRestore: 0, value: 4000, luck: false, moveSpeed: 0 },
    { id: 'thunder_staff', name: 'B\u00e1culo del Trueno', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 140, attackMin: 22, attackMax: 35, defense: 0, wizRaise: 0.38, hpRestore: 0, mpRestore: 0, value: 10000, luck: false, moveSpeed: 0 },
    { id: 'gorgon_staff', name: 'B\u00e1culo de Gorgona', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 200, attackMin: 30, attackMax: 45, defense: 0, wizRaise: 0.50, hpRestore: 0, mpRestore: 0, value: 25000, luck: false, moveSpeed: 0 },
    { id: 'legendary_staff', name: 'B\u00e1culo Legendario', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 280, attackMin: 42, attackMax: 58, defense: 0, wizRaise: 0.65, hpRestore: 0, mpRestore: 0, value: 60000, luck: false, moveSpeed: 0 },
    { id: 'resurrection_staff', name: 'B\u00e1culo de Resurrecci\u00f3n', type: 'weapon', classRestriction: 'mago', slot: 'weapon', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 360, attackMin: 55, attackMax: 75, defense: 0, wizRaise: 0.80, hpRestore: 0, mpRestore: 0, value: 150000, luck: false, moveSpeed: 0 },
    // DK ARMOR
    { id: 'leather_armor', name: 'Armadura de Cuero', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 8, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 300, luck: false, moveSpeed: 0 },
    { id: 'bronze_armor', name: 'Armadura de Bronce', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 18, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 1500, luck: false, moveSpeed: 0 },
    { id: 'scale_armor', name: 'Armadura de Escamas', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 53, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 30, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 5000, luck: false, moveSpeed: 0 },
    { id: 'brass_armor', name: 'Armadura de Lat\u00f3n', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 75, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 42, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 15000, luck: false, moveSpeed: 0 },
    { id: 'plate_armor', name: 'Armadura de Placas', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 92, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 55, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 35000, luck: false, moveSpeed: 0 },
    { id: 'dragon_armor', name: 'Armadura de Drag\u00f3n', type: 'armor', classRestriction: 'dk', slot: 'armor', levelReq: 110, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 70, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 80000, luck: false, moveSpeed: 0 },
    // DK HELM
    { id: 'leather_helm', name: 'Casco de Cuero', type: 'helm', classRestriction: 'dk', slot: 'helm', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 4, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 150, luck: false, moveSpeed: 0 },
    { id: 'bronze_helm', name: 'Casco de Bronce', type: 'helm', classRestriction: 'dk', slot: 'helm', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 9, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 750, luck: false, moveSpeed: 0 },
    { id: 'scale_helm', name: 'Casco de Escamas', type: 'helm', classRestriction: 'dk', slot: 'helm', levelReq: 53, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 15, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 2500, luck: false, moveSpeed: 0 },
    { id: 'dragon_helm', name: 'Casco de Drag\u00f3n', type: 'helm', classRestriction: 'dk', slot: 'helm', levelReq: 110, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 35, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 40000, luck: false, moveSpeed: 0 },
    // DK PANTS
    { id: 'leather_pants', name: 'Pantalones de Cuero', type: 'pants', classRestriction: 'dk', slot: 'pants', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 5, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 200, luck: false, moveSpeed: 0 },
    { id: 'bronze_pants', name: 'Pantalones de Bronce', type: 'pants', classRestriction: 'dk', slot: 'pants', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 12, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 1000, luck: false, moveSpeed: 0 },
    { id: 'scale_pants', name: 'Pantalones de Escamas', type: 'pants', classRestriction: 'dk', slot: 'pants', levelReq: 53, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 20, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 3500, luck: false, moveSpeed: 0 },
    { id: 'dragon_pants', name: 'Pantalones de Drag\u00f3n', type: 'pants', classRestriction: 'dk', slot: 'pants', levelReq: 110, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 45, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 50000, luck: false, moveSpeed: 0 },
    // DK GLOVES
    { id: 'leather_gloves', name: 'Guantes de Cuero', type: 'gloves', classRestriction: 'dk', slot: 'gloves', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 3, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 120, luck: false, moveSpeed: 0 },
    { id: 'bronze_gloves', name: 'Guantes de Bronce', type: 'gloves', classRestriction: 'dk', slot: 'gloves', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 7, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 600, luck: false, moveSpeed: 0 },
    { id: 'dragon_gloves', name: 'Guantes de Drag\u00f3n', type: 'gloves', classRestriction: 'dk', slot: 'gloves', levelReq: 110, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 25, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 30000, luck: false, moveSpeed: 0 },
    // DK BOOTS
    { id: 'leather_boots', name: 'Botas de Cuero', type: 'boots', classRestriction: 'dk', slot: 'boots', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 3, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 120, luck: false, moveSpeed: 0 },
    { id: 'bronze_boots', name: 'Botas de Bronce', type: 'boots', classRestriction: 'dk', slot: 'boots', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 7, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 600, luck: false, moveSpeed: 0 },
    { id: 'dragon_boots', name: 'Botas de Drag\u00f3n', type: 'boots', classRestriction: 'dk', slot: 'boots', levelReq: 110, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 25, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 30000, luck: false, moveSpeed: 0 },
    // ELF ARMOR
    { id: 'vine_armor', name: 'Armadura de Vid', type: 'armor', classRestriction: 'elf', slot: 'armor', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 6, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 300, luck: false, moveSpeed: 0 },
    { id: 'silk_armor', name: 'Armadura de Seda', type: 'armor', classRestriction: 'elf', slot: 'armor', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 15, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 1500, luck: false, moveSpeed: 0 },
    { id: 'wind_armor', name: 'Armadura de Viento', type: 'armor', classRestriction: 'elf', slot: 'armor', levelReq: 47, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 25, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 5000, luck: false, moveSpeed: 0 },
    { id: 'spirit_armor', name: 'Armadura de Esp\u00edritu', type: 'armor', classRestriction: 'elf', slot: 'armor', levelReq: 68, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 38, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 15000, luck: false, moveSpeed: 0 },
    { id: 'guardian_armor', name: 'Armadura de Guardi\u00e1n', type: 'armor', classRestriction: 'elf', slot: 'armor', levelReq: 87, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 50, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 40000, luck: false, moveSpeed: 0 },
    // MAGO ARMOR
    { id: 'pad_armor', name: 'Armadura de Tela', type: 'armor', classRestriction: 'mago', slot: 'armor', levelReq: 10, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 5, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 200, luck: false, moveSpeed: 0 },
    { id: 'bone_armor', name: 'Armadura de Hueso', type: 'armor', classRestriction: 'mago', slot: 'armor', levelReq: 29, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 12, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 1000, luck: false, moveSpeed: 0 },
    { id: 'sphinx_armor', name: 'Armadura de Esfinge', type: 'armor', classRestriction: 'mago', slot: 'armor', levelReq: 51, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 22, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 4500, luck: false, moveSpeed: 0 },
    { id: 'legendary_armor', name: 'Armadura Legendaria', type: 'armor', classRestriction: 'mago', slot: 'armor', levelReq: 75, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 35, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 14000, luck: false, moveSpeed: 0 },
    { id: 'eclipse_armor', name: 'Armadura de Eclipse', type: 'armor', classRestriction: 'mago', slot: 'armor', levelReq: 93, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 48, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 40000, luck: false, moveSpeed: 0 },
    // POTIONS
    { id: 'small_hp_potion', name: 'Poci\u00f3n HP Peque\u00f1a', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 50, mpRestore: 0, value: 50, luck: false, moveSpeed: 0 },
    { id: 'hp_potion', name: 'Poci\u00f3n HP', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 150, mpRestore: 0, value: 150, luck: false, moveSpeed: 0 },
    { id: 'large_hp_potion', name: 'Poci\u00f3n HP Grande', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 400, mpRestore: 0, value: 400, luck: false, moveSpeed: 0 },
    { id: 'small_mp_potion', name: 'Poci\u00f3n MP Peque\u00f1a', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 40, value: 60, luck: false, moveSpeed: 0 },
    { id: 'mp_potion', name: 'Poci\u00f3n MP', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 120, value: 180, luck: false, moveSpeed: 0 },
    { id: 'large_mp_potion', name: 'Poci\u00f3n MP Grande', type: 'potion', classRestriction: 'all', slot: 'potion', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 350, value: 450, luck: false, moveSpeed: 0 },
    // JEWELS
    { id: 'jewel_of_bless', name: 'Joya de Bendici\u00f3n', type: 'jewel', classRestriction: 'all', slot: 'jewel', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 500000, luck: false, moveSpeed: 0, upgradeChance: 1.0, upgradeMaxLevel: 6 },
    { id: 'jewel_of_soul', name: 'Joya de Alma', type: 'jewel', classRestriction: 'all', slot: 'jewel', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 500000, luck: false, moveSpeed: 0, upgradeChance: 0.5, upgradeMaxLevel: 9 },
    { id: 'jewel_of_chaos', name: 'Joya del Caos', type: 'jewel', classRestriction: 'all', slot: 'jewel', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 0, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 100000, luck: false, moveSpeed: 0 },
    // AMMO
    { id: 'arrows', name: 'Flechas', type: 'ammo', classRestriction: 'elf', slot: 'ammo', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 2, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 10, luck: false, moveSpeed: 0 },
    { id: 'bolts', name: 'Virote', type: 'ammo', classRestriction: 'elf', slot: 'ammo', levelReq: 0, reqStr: 0, reqAgi: 0, reqVit: 0, reqEne: 0, attackMin: 0, attackMax: 3, defense: 0, wizRaise: 0, hpRestore: 0, mpRestore: 0, value: 15, luck: false, moveSpeed: 0 }
  ],

  skills: {
    // DK SKILLS
    normal_attack: { id: 'normal_attack', name: 'Ataque Normal', class: 'dk', levelRequirement: 1, manaCost: 0, agCost: 0, cooldown: 0.8, damageModifier: 1.0, range: 1.5, areaOfEffect: 0, type: 'melee', description: 'Un ataque b\u00e1sico cuerpo a cuerpo.', icon: 'normal_attack' },
    twisting_slash: { id: 'twisting_slash', name: 'Tajo Giratorio', class: 'dk', levelRequirement: 30, manaCost: 8, agCost: 10, cooldown: 3, damageModifier: 1.6, range: 2.5, areaOfEffect: 2.0, type: 'melee_aoe', description: 'Golpea a todos los enemigos cercanos con un tajo giratorio.', icon: 'twisting_slash' },
    impale: { id: 'impale', name: 'Empalar', class: 'dk', levelRequirement: 80, manaCost: 10, agCost: 12, cooldown: 2, damageModifier: 1.3, range: 3.0, areaOfEffect: 0, type: 'melee', description: 'Ataque que empala al enemigo causando gran da\u00f1o.', icon: 'impale' },
    swell_life: { id: 'swell_life', name: 'Hinchaz\u00f3n de Vida', class: 'dk', levelRequirement: 120, manaCost: 20, agCost: 0, cooldown: 60, damageModifier: 0, range: 0, areaOfEffect: 0, type: 'buff', hpMultiplier: 1.3, duration: 120, description: 'Aumenta la vida m\u00e1xima en un 30% durante 120 segundos.', icon: 'swell_life' },
    death_stab: { id: 'death_stab', name: 'Pu\u00f1alada Mortal', class: 'dk', levelRequirement: 160, manaCost: 14, agCost: 15, cooldown: 3.5, damageModifier: 2.0, range: 1.5, areaOfEffect: 0, type: 'melee', description: 'Una pu\u00f1alada mortal que causa el doble de da\u00f1o.', icon: 'death_stab' },
    rageful_blow: { id: 'rageful_blow', name: 'Golpe Furioso', class: 'dk', levelRequirement: 170, manaCost: 16, agCost: 18, cooldown: 4, damageModifier: 2.4, range: 2.0, areaOfEffect: 1.5, type: 'melee_aoe', description: 'Golpe furioso que da\u00f1a a todos los enemigos cercanos.', icon: 'rageful_blow' },
    strike_of_destruction: { id: 'strike_of_destruction', name: 'Golpe de Destrucci\u00f3n', class: 'dk', levelRequirement: 220, manaCost: 30, agCost: 25, cooldown: 6, damageModifier: 3.0, range: 2.5, areaOfEffect: 2.5, type: 'melee_aoe', description: 'El golpe m\u00e1s poderoso del Caballero Oscuro, causa da\u00f1o masivo.', icon: 'strike_of_destruction' },
    // ELF SKILLS
    elf_normal_attack: { id: 'elf_normal_attack', name: 'Ataque Normal', class: 'elf', levelRequirement: 1, manaCost: 0, agCost: 0, cooldown: 0.8, damageModifier: 1.0, range: 6.0, areaOfEffect: 0, type: 'ranged', description: 'Un disparo b\u00e1sico con arco.', icon: 'normal_attack' },
    penetration: { id: 'penetration', name: 'Penetraci\u00f3n', class: 'elf', levelRequirement: 30, manaCost: 6, agCost: 8, cooldown: 2, damageModifier: 1.5, range: 7.0, areaOfEffect: 0, type: 'ranged', description: 'Flecha de penetraci\u00f3n que atraviesa al enemigo.', icon: 'penetration' },
    triple_shot: { id: 'triple_shot', name: 'Disparo Triple', class: 'elf', levelRequirement: 150, manaCost: 14, agCost: 12, cooldown: 4, damageModifier: 1.0, range: 6.0, areaOfEffect: 0, type: 'ranged', hits: 3, description: 'Dispara tres flechas r\u00e1pidamente.', icon: 'triple_shot' },
    heal: { id: 'heal', name: 'Curar', class: 'elf', levelRequirement: 56, manaCost: 20, agCost: 0, cooldown: 5, damageModifier: 0, range: 5.0, areaOfEffect: 0, type: 'heal', healPercent: 0.3, description: 'Cura un 30% de la vida m\u00e1xima del objetivo.', icon: 'heal' },
    greater_damage: { id: 'greater_damage', name: 'Mayor Da\u00f1o', class: 'elf', levelRequirement: 80, manaCost: 30, agCost: 0, cooldown: 120, damageModifier: 0, range: 0, areaOfEffect: 0, type: 'buff', atkMultiplier: 1.2, duration: 180, description: 'Aumenta el ataque en un 20% durante 180 segundos.', icon: 'greater_damage' },
    greater_defense: { id: 'greater_defense', name: 'Mayor Defensa', class: 'elf', levelRequirement: 80, manaCost: 30, agCost: 0, cooldown: 120, damageModifier: 0, range: 0, areaOfEffect: 0, type: 'buff', defMultiplier: 1.2, duration: 180, description: 'Aumenta la defensa en un 20% durante 180 segundos.', icon: 'greater_defense' },
    ice_arrow: { id: 'ice_arrow', name: 'Flecha de Hielo', class: 'elf', levelRequirement: 92, manaCost: 10, agCost: 10, cooldown: 3, damageModifier: 1.3, range: 7.0, areaOfEffect: 0, type: 'ranged', slow: 0.5, slowDuration: 3, description: 'Flecha helada que ralentiza al enemigo.', icon: 'ice_arrow' },
    summon_goblin: { id: 'summon_goblin', name: 'Invocar Goblin', class: 'elf', levelRequirement: 22, manaCost: 25, agCost: 0, cooldown: 10, damageModifier: 0, range: 0, areaOfEffect: 0, type: 'summon', monsterId: 'goblin', duration: 60, description: 'Invoca un Goblin que lucha a tu lado durante 60 segundos.', icon: 'summon_goblin' },
    // MAGO SKILLS
    fire_ball: { id: 'fire_ball', name: 'Bola de Fuego', class: 'mago', levelRequirement: 1, manaCost: 6, agCost: 6, cooldown: 1.5, damageModifier: 1.2, range: 6.0, areaOfEffect: 0, type: 'projectile', description: 'Lanza una bola de fuego contra el enemigo.', icon: 'fire_ball' },
    power_wave: { id: 'power_wave', name: 'Onda de Poder', class: 'mago', levelRequirement: 7, manaCost: 8, agCost: 8, cooldown: 2, damageModifier: 1.4, range: 5.0, areaOfEffect: 0, type: 'projectile', description: 'Una onda de poder que golpea al enemigo.', icon: 'power_wave' },
    lightning: { id: 'lightning', name: 'Rel\u00e1mpago', class: 'mago', levelRequirement: 13, manaCost: 12, agCost: 10, cooldown: 2.5, damageModifier: 1.6, range: 6.0, areaOfEffect: 0, type: 'projectile', description: 'Invoca un rayo del cielo contra el enemigo.', icon: 'lightning' },
    teleport: { id: 'teleport', name: 'Teletransporte', class: 'mago', levelRequirement: 17, manaCost: 15, agCost: 0, cooldown: 3, damageModifier: 0, range: 4.0, areaOfEffect: 0, type: 'teleport', description: 'Te teletransporta a una posici\u00f3n cercana.', icon: 'teleport' },
    meteorite: { id: 'meteorite', name: 'Meteorito', class: 'mago', levelRequirement: 21, manaCost: 18, agCost: 14, cooldown: 3.5, damageModifier: 2.0, range: 6.0, areaOfEffect: 2.0, type: 'projectile_aoe', description: 'Invoca un meteorito que da\u00f1a a todos los enemigos en el \u00e1rea.', icon: 'meteorite' },
    ice: { id: 'ice', name: 'Hielo', class: 'mago', levelRequirement: 25, manaCost: 14, agCost: 12, cooldown: 3, damageModifier: 1.5, range: 6.0, areaOfEffect: 0, type: 'projectile', slow: 0.5, slowDuration: 3, description: 'Congela al enemigo ralentizando su movimiento.', icon: 'ice' },
    poison: { id: 'poison', name: 'Veneno', class: 'mago', levelRequirement: 30, manaCost: 16, agCost: 14, cooldown: 3, damageModifier: 1.5, range: 6.0, areaOfEffect: 0, type: 'projectile', dotDamage: 10, dotDuration: 5, description: 'Envenena al enemigo causando da\u00f1o progresivo.', icon: 'poison' },
    flame: { id: 'flame', name: 'Llama', class: 'mago', levelRequirement: 34, manaCost: 22, agCost: 16, cooldown: 4, damageModifier: 2.2, range: 5.0, areaOfEffect: 2.0, type: 'projectile_aoe', description: 'Una llamarada que quema a todos los enemigos en el \u00e1rea.', icon: 'flame' },
    twister: { id: 'twister', name: 'Torbellino', class: 'mago', levelRequirement: 38, manaCost: 20, agCost: 18, cooldown: 3.5, damageModifier: 2.4, range: 5.0, areaOfEffect: 2.0, type: 'projectile_aoe', description: 'Un torbellino que arrastra y da\u00f1a a los enemigos.', icon: 'twister' },
    hellfire: { id: 'hellfire', name: 'Fuego Infernal', class: 'mago', levelRequirement: 42, manaCost: 30, agCost: 20, cooldown: 5, damageModifier: 2.8, range: 5.0, areaOfEffect: 3.0, type: 'projectile_aoe', description: 'Llueve fuego del infierno sobre los enemigos.', icon: 'hellfire' },
    aqua_beam: { id: 'aqua_beam', name: 'Rayo de Agua', class: 'mago', levelRequirement: 60, manaCost: 24, agCost: 18, cooldown: 4, damageModifier: 2.5, range: 6.0, areaOfEffect: 0, type: 'projectile', description: 'Un potente rayo de agua que perfora al enemigo.', icon: 'aqua_beam' },
    cometfall: { id: 'cometfall', name: 'Lluvia de Cometas', class: 'mago', levelRequirement: 70, manaCost: 26, agCost: 20, cooldown: 4.5, damageModifier: 2.6, range: 6.0, areaOfEffect: 2.5, type: 'projectile_aoe', description: 'Invoca una lluvia de cometas sobre el \u00e1rea.', icon: 'cometfall' },
    inferno: { id: 'inferno', name: 'Infierno', class: 'mago', levelRequirement: 80, manaCost: 35, agCost: 24, cooldown: 5.5, damageModifier: 3.0, range: 5.0, areaOfEffect: 3.0, type: 'projectile_aoe', description: 'Abre las puertas del infierno causando gran da\u00f1o.', icon: 'inferno' },
    evil_spirit: { id: 'evil_spirit', name: 'Esp\u00edritu Maligno', class: 'mago', levelRequirement: 90, manaCost: 40, agCost: 28, cooldown: 6, damageModifier: 3.2, range: 6.0, areaOfEffect: 3.0, type: 'projectile_aoe', description: 'Libera esp\u00edritus malignos que devoran a los enemigos.', icon: 'evil_spirit' },
    nova: { id: 'nova', name: 'Nova', class: 'mago', levelRequirement: 220, manaCost: 60, agCost: 40, cooldown: 15, damageModifier: 4.0, range: 6.0, areaOfEffect: 4.0, type: 'projectile_aoe', description: 'La habilidad definitiva del Mago, una explosi\u00f3n de poder puro.', icon: 'nova' }
  },

  npcs: {
    hanzo: { id: 'hanzo', name: 'Hanzo', mapId: 'lorencia', x: 116, y: 141, shopItemIds: ['short_sword', 'blade', 'gladius', 'leather_armor', 'leather_helm', 'leather_pants', 'leather_gloves', 'leather_boots', 'bronze_armor', 'bronze_helm'] },
    pasi: { id: 'pasi', name: 'Pasi', mapId: 'lorencia', x: 118, y: 113, shopItemIds: ['skull_staff', 'angelic_staff', 'pad_armor', 'bone_armor'] },
    amy: { id: 'amy', name: 'Amy', mapId: 'lorencia', x: 127, y: 86, shopItemIds: ['small_hp_potion', 'hp_potion', 'small_mp_potion', 'mp_potion'] },
    lumen: { id: 'lumen', name: 'Lumen', mapId: 'lorencia', x: 123, y: 135, shopItemIds: ['arrows', 'bolts'] },
    lala: { id: 'lala', name: 'Lala', mapId: 'noria', x: 173, y: 124, shopItemIds: ['short_bow', 'bow', 'vine_armor', 'silk_armor', 'small_hp_potion', 'hp_potion', 'small_mp_potion', 'mp_potion'] },
    gallus: { id: 'gallus', name: 'Gallus', mapId: 'noria', x: 196, y: 123, shopItemIds: ['elven_bow', 'long_bow', 'crossbow', 'arrows', 'bolts'] },
    chaos_goblin: { id: 'chaos_goblin', name: 'Chaos Goblin', mapId: 'noria', x: 180, y: 103, shopItemIds: ['jewel_of_bless', 'jewel_of_soul', 'jewel_of_chaos'] },
    zienna: { id: 'zienna', name: 'Zienna', mapId: 'davias', x: 186, y: 47, shopItemIds: ['falchion', 'double_axe', 'scimitar', 'scale_armor', 'brass_armor', 'plate_armor', 'serpent_staff', 'thunder_staff', 'wind_armor', 'spirit_armor'] },
    izabel: { id: 'izabel', name: 'Izabel', mapId: 'davias', x: 225, y: 41, shopItemIds: ['large_hp_potion', 'large_mp_potion', 'hp_potion', 'mp_potion'] }
  },

  maps: {},

  // Helper functions
  getMonster: function(id) { return this.monsters[id]; },
  getItem: function(id) { return this.items.find(function(i) { return i.id === id; }); },
  getSkill: function(id) { return this.skills[id]; },
  getNpc: function(id) { return this.npcs[id]; },
  getMap: function(id) { return this.maps[id]; },
  getClass: function(id) { return this.classes[id]; },
  getItemsByClass: function(classId) {
    var restriction = classId === 'dark_knight' ? 'dk' : (classId === 'elf' ? 'elf' : 'mago');
    return this.items.filter(function(i) {
      return i.classRestriction === restriction || i.classRestriction === 'all';
    });
  },
  getItemById: function(id) { return this.getItem(id); }
};

// Generate maps procedurally
(function() {
  function makeMap(id, name, w, h, conns, spawnDefs, npcs, density) {
    var cpoints = conns.map(function(c) { return [c.x, c.y]; });
    var grid = generateTileData(w, h, id, cpoints, density || 0.05);
    var spawns = [];
    var spawnZones = [];
    for (var i = 0; i < spawnDefs.length; i++) {
      var zoneIdx = i % 5;
      var cx = [Math.floor(w/4), Math.floor(3*w/4), Math.floor(w/2), Math.floor(w/4), Math.floor(3*w/4)][zoneIdx];
      var cy = [Math.floor(h/4), Math.floor(h/4), Math.floor(h/2), Math.floor(3*h/4), Math.floor(3*h/4)][zoneIdx];
      var sd = spawnDefs[i];
      var more = distributeSpawns(grid, sd.monsterId, sd.count, id + '_' + sd.monsterId, [cx, cy]);
      spawns = spawns.concat(more);
    }
    GameData.maps[id] = {
      id: id,
      name: name,
      width: w,
      height: h,
      connectionPoints: conns,
      spawnPoints: spawns,
      npcs: npcs,
      tileData: grid
    };
  }

  // LORENCIA 80x80
  makeMap('lorencia', 'Lorencia', 80, 80, [
    { targetMap: 'noria', x: 0, y: 40 },
    { targetMap: 'dungeon_1', x: 40, y: 0 },
    { targetMap: 'davias', x: 80, y: 40 }
  ], [
    { monsterId: 'spider', count: 4 },
    { monsterId: 'budge_dragon', count: 4 },
    { monsterId: 'bull_fighter', count: 3 },
    { monsterId: 'hound', count: 3 },
    { monsterId: 'elite_bull_fighter', count: 2 },
    { monsterId: 'giant', count: 1 }
  ], ['hanzo', 'pasi', 'amy', 'lumen']);

  // NORIA 80x80
  makeMap('noria', 'Noria', 80, 80, [
    { targetMap: 'lorencia', x: 80, y: 40 }
  ], [
    { monsterId: 'goblin', count: 4 },
    { monsterId: 'chain_scorpion', count: 3 },
    { monsterId: 'elite_goblin', count: 3 },
    { monsterId: 'beetle_monster', count: 2 },
    { monsterId: 'stone_golem', count: 1 },
    { monsterId: 'agon', count: 1 },
    { monsterId: 'forest_monster', count: 1 }
  ], ['lala', 'gallus', 'chaos_goblin']);

  // DAVIAS 80x80
  makeMap('davias', 'Davias', 80, 80, [
    { targetMap: 'lorencia', x: 0, y: 40 },
    { targetMap: 'losttower_1', x: 40, y: 80 }
  ], [
    { monsterId: 'ice_monster', count: 3 },
    { monsterId: 'hommerd', count: 3 },
    { monsterId: 'yeti', count: 3 },
    { monsterId: 'assassin', count: 2 },
    { monsterId: 'elite_yeti', count: 2 },
    { monsterId: 'ice_queen', count: 1 }
  ], ['zienna', 'izabel']);

  // DUNGEON PISO 1 64x64
  makeMap('dungeon_1', 'Dungeon Piso 1', 64, 64, [
    { targetMap: 'lorencia', x: 32, y: 64 },
    { targetMap: 'dungeon_2', x: 32, y: 0 }
  ], [
    { monsterId: 'ghost', count: 4 },
    { monsterId: 'larva', count: 4 },
    { monsterId: 'skeleton_warrior', count: 3 },
    { monsterId: 'cyclops', count: 2 }
  ], [], 0.08);

  // DUNGEON PISO 2 64x64
  makeMap('dungeon_2', 'Dungeon Piso 2', 64, 64, [
    { targetMap: 'dungeon_1', x: 32, y: 64 },
    { targetMap: 'dungeon_3', x: 32, y: 0 }
  ], [
    { monsterId: 'skeleton_archer', count: 3 },
    { monsterId: 'hell_spider', count: 3 },
    { monsterId: 'hell_hound', count: 2 }
  ], [], 0.08);

  // DUNGEON PISO 3 64x64
  makeMap('dungeon_3', 'Dungeon Piso 3', 64, 64, [
    { targetMap: 'dungeon_2', x: 32, y: 64 }
  ], [
    { monsterId: 'hell_hound', count: 2 },
    { monsterId: 'poison_bull', count: 2 },
    { monsterId: 'dark_knight_mob', count: 2 },
    { monsterId: 'gorgon', count: 1 }
  ], [], 0.08);

  // LOST TOWER FLOORS 48x48
  var ltMaps = [
    { id: 'losttower_1', name: 'Lost Tower Piso 1', conns: [{ targetMap: 'davias', x: 24, y: 0 }, { targetMap: 'losttower_2', x: 24, y: 48 }], spawns: [{ monsterId: 'shadow', count: 3 }] },
    { id: 'losttower_2', name: 'Lost Tower Piso 2', conns: [{ targetMap: 'losttower_1', x: 24, y: 0 }, { targetMap: 'losttower_3', x: 24, y: 48 }], spawns: [{ monsterId: 'poison_shadow', count: 3 }, { monsterId: 'cursed_wizard', count: 2 }] },
    { id: 'losttower_3', name: 'Lost Tower Piso 3', conns: [{ targetMap: 'losttower_2', x: 24, y: 0 }, { targetMap: 'losttower_4', x: 24, y: 48 }], spawns: [{ monsterId: 'death_cow', count: 3 }] },
    { id: 'losttower_4', name: 'Lost Tower Piso 4', conns: [{ targetMap: 'losttower_3', x: 24, y: 0 }, { targetMap: 'losttower_5', x: 24, y: 48 }], spawns: [{ monsterId: 'devil', count: 3 }] },
    { id: 'losttower_5', name: 'Lost Tower Piso 5', conns: [{ targetMap: 'losttower_4', x: 24, y: 0 }, { targetMap: 'losttower_6', x: 24, y: 48 }], spawns: [{ monsterId: 'death_knight_mob', count: 3 }] },
    { id: 'losttower_6', name: 'Lost Tower Piso 6', conns: [{ targetMap: 'losttower_5', x: 24, y: 0 }, { targetMap: 'losttower_7', x: 24, y: 48 }], spawns: [{ monsterId: 'devil', count: 2 }] },
    { id: 'losttower_7', name: 'Lost Tower Piso 7', conns: [{ targetMap: 'losttower_6', x: 24, y: 0 }], spawns: [{ monsterId: 'devil', count: 2 }, { monsterId: 'balrog', count: 1 }] }
  ];

  for (var li = 0; li < ltMaps.length; li++) {
    var lt = ltMaps[li];
    var ltGrid = generateTileData(48, 48, lt.id, lt.conns.map(function(c) { return [c.x, c.y]; }), 0.07);
    var ltSpawns = [];
    for (var si = 0; si < lt.spawns.length; si++) {
      var sd = lt.spawns[si];
      var szIdx = si % 2;
      var szCx = [16, 32][szIdx];
      var szCy = [24, 24][szIdx];
      var more = distributeSpawns(ltGrid, sd.monsterId, sd.count, lt.id + '_' + sd.monsterId, [szCx, szCy]);
      ltSpawns = ltSpawns.concat(more);
    }
    GameData.maps[lt.id] = {
      id: lt.id,
      name: lt.name,
      width: 48,
      height: 48,
      connectionPoints: lt.conns,
      spawnPoints: ltSpawns,
      npcs: [],
      tileData: ltGrid
    };
  }
})();

// Expose GameData globally
window.GameData = GameData;
