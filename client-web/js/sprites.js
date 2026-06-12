const Sprites = {
  cache: {},

  get: function(id) {
    if (this.cache[id]) return this.cache[id];
    let parts = id.split('_');
    let type = parts[0];
    switch (type) {
      case 'player': {
        let className = parts[1];
        let direction = parts[2] || 'down';
        this.cache[id] = this.generatePlayer(className, direction);
        break;
      }
      case 'monster': {
        let monsterId = parts.slice(1).join('_');
        this.cache[id] = this.generateMonster(monsterId);
        break;
      }
      case 'tile': {
        let tileType = parts[1];
        this.cache[id] = this.generateTile(tileType);
        break;
      }
      case 'npc': {
        let npcId = parts.slice(1).join('_');
        this.cache[id] = this.generateNPC(npcId);
        break;
      }
      case 'item': {
        let itemId = parts.slice(1).join('_');
        this.cache[id] = this.generateItemIcon(itemId);
        break;
      }
      case 'skill': {
        let skillId = parts.slice(1).join('_');
        this.cache[id] = this.generateSkillIcon(skillId);
        break;
      }
      case 'ui': {
        let uiElement = parts.slice(1).join('_');
        this.cache[id] = this.generateUIElement(uiElement);
        break;
      }
      default:
        let canvas = this.createCanvas(32, 32);
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#000000';
        ctx.font = '10px monospace';
        ctx.fillText('?', 12, 20);
        this.cache[id] = canvas;
    }
    return this.cache[id];
  },

  createCanvas: function(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },

  drawPixel: function(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
  },

  drawRect: function(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  },

  generatePlayer: function(className, direction) {
    const size = 32;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    let skinColor = '#f5d0a9';
    let armorColor1, armorColor2, hairColor, weaponColor, weaponType;
    let hasHelmet = false, hasHat = false;

    switch (className) {
      case 'DarkKnight':
        armorColor1 = '#8b0000'; armorColor2 = '#4a0000'; hairColor = '#3a3a3a';
        weaponColor = '#c0c0c0'; weaponType = 'sword'; hasHelmet = true;
        break;
      case 'Elf':
        armorColor1 = '#2d8a4e'; armorColor2 = '#1a5c32'; hairColor = '#ffd700';
        weaponColor = '#8b6914'; weaponType = 'bow';
        break;
      case 'Mago':
        armorColor1 = '#1e3a8a'; armorColor2 = '#0f1f5e'; hairColor = '#8b4513';
        weaponColor = '#a0c0e0'; weaponType = 'staff'; hasHat = true;
        break;
      default:
        armorColor1 = '#666'; armorColor2 = '#444'; hairColor = '#333';
        weaponColor = '#888'; weaponType = 'sword';
    }

    let flip = (direction === 'left');
    function px(x) { return flip ? (31 - x) : x; }

    // HEAD
    if (hasHelmet) {
      ctx.fillStyle = armorColor2;
      ctx.fillRect(px(12),2,8,4); ctx.fillRect(px(11),3,10,3); ctx.fillRect(px(11),5,10,4);
      ctx.fillStyle = armorColor1;
      ctx.fillRect(px(13),1,6,2); ctx.fillRect(px(12),2,2,2); ctx.fillRect(px(18),2,2,2);
      ctx.fillStyle = '#000';
      ctx.fillRect(px(13),5,2,2); ctx.fillRect(px(17),5,2,2);
      ctx.fillStyle = skinColor;
      ctx.fillRect(px(12),8,8,3);
      ctx.fillStyle = armorColor1;
      ctx.fillRect(px(10),4,2,5); ctx.fillRect(px(20),4,2,5);
    } else if (hasHat) {
      ctx.fillStyle = '#1a3a7a';
      ctx.fillRect(px(12),0,8,2); ctx.fillRect(px(13),1,6,2);
      ctx.fillRect(px(14),2,4,2); ctx.fillRect(px(15),3,2,1);
      ctx.fillStyle = armorColor1;
      ctx.fillRect(px(10),4,12,2);
      ctx.fillStyle = skinColor;
      ctx.fillRect(px(12),6,8,5);
      ctx.fillStyle = '#000';
      ctx.fillRect(px(13),8,2,1); ctx.fillRect(px(17),8,2,1);
      ctx.fillStyle = '#c04040';
      ctx.fillRect(px(14),11,4,1);
      ctx.fillStyle = hairColor;
      ctx.fillRect(px(11),5,2,4); ctx.fillRect(px(19),5,2,4);
    } else {
      ctx.fillStyle = hairColor;
      ctx.fillRect(px(12),1,8,3); ctx.fillRect(px(11),3,10,3);
      ctx.fillStyle = skinColor;
      ctx.fillRect(px(12),5,8,5);
      ctx.fillStyle = '#000';
      ctx.fillRect(px(13),7,2,1); ctx.fillRect(px(17),7,2,1);
      ctx.fillStyle = '#c04040';
      ctx.fillRect(px(14),10,4,1);
      if (className === 'Elf') {
        ctx.fillStyle = skinColor;
        ctx.fillRect(px(10),5,2,2); ctx.fillRect(px(20),5,2,2);
      }
      ctx.fillStyle = hairColor;
      ctx.fillRect(px(11),3,2,3); ctx.fillRect(px(19),3,2,3);
    }

    // BODY
    let bodyY = hasHelmet ? 10 : (hasHat ? 11 : 11);
    ctx.fillStyle = armorColor2;
    ctx.fillRect(px(12),bodyY,8,6);
    ctx.fillStyle = armorColor1;
    ctx.fillRect(px(12),bodyY,8,2);
    ctx.fillRect(px(13),bodyY+2,6,2);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(px(12),bodyY+5,8,1);
    ctx.fillStyle = armorColor1;
    ctx.fillRect(px(10),bodyY,2,3);
    ctx.fillRect(px(20),bodyY,2,3);

    // ARMS
    let armY = bodyY + 1;
    ctx.fillStyle = skinColor;
    ctx.fillRect(px(9),armY,2,4);
    ctx.fillRect(px(21),armY,2,4);

    // LEGS
    let legY = bodyY + 6;
    ctx.fillStyle = armorColor2;
    ctx.fillRect(px(13),legY,3,5);
    ctx.fillRect(px(16),legY,3,5);
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(px(13),legY+4,3,2);
    ctx.fillRect(px(16),legY+4,3,2);

    // WEAPON
    if (weaponType === 'sword') {
      let swx = flip ? 8 : 23;
      ctx.fillStyle = weaponColor;
      ctx.fillRect(px(swx),armY-2,2,8);
      ctx.fillRect(px(swx+(flip?0:-1)),armY-4,3,3);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(px(swx-(flip?1:0)),armY,3,1);
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(px(swx),armY+7,2,3);
      ctx.fillStyle = '#4a0000';
      ctx.fillRect(px(7),armY,2,4);
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(px(6),armY-1,4,1); ctx.fillRect(px(6),armY+4,4,1);
      ctx.fillRect(px(6),armY,1,4); ctx.fillRect(px(9),armY,1,4);
    } else if (weaponType === 'bow') {
      let bx = flip ? 20 : 8;
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(px(bx),armY-1,1,6);
      ctx.fillRect(px(bx+(flip?-2:2)),armY,1,5);
      ctx.fillRect(px(bx+(flip?-1:1)),armY-1,1,7);
      ctx.fillRect(px(bx+(flip?-1:1)),armY-2,1,9);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(px(flip?22:9),armY-1,1,5);
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(px(flip?9:22),bodyY-2,1,4);
    } else if (weaponType === 'staff') {
      let stx = flip ? 8 : 23;
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(px(stx),bodyY-4,2,12);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(px(stx-1),bodyY-6,4,3);
      ctx.fillStyle = '#88bbff';
      ctx.fillRect(px(stx),bodyY-5,2,1);
    }

    if (direction === 'up') {
      ctx.fillStyle = hairColor;
      ctx.fillRect(px(11),5,10,4);
      if (hasHelmet) {
        ctx.fillStyle = armorColor1;
        ctx.fillRect(px(11),4,10,6); ctx.fillRect(px(12),3,8,2);
      }
      if (hasHat) {
        ctx.fillStyle = '#1a3a7a';
        ctx.fillRect(px(12),0,8,2); ctx.fillRect(px(13),1,6,2);
        ctx.fillRect(px(14),2,4,2); ctx.fillRect(px(15),3,2,1);
      }
    }

    return canvas;
  },

  generateMonster: function(monsterId) {
    const m = {
      spider:{w:24,h:24,c:['#3d1f00','#5c3a1e','#1a0e00','#8b4513','#ff0000']},
      budge_dragon:{w:32,h:32,c:['#2d5a1e','#1a3d10','#0f2808','#ffaa00','#ffff00']},
      bull_fighter:{w:32,h:32,c:['#6b3a1e','#4a2510','#8b4513','#ff6600','#f5d0a9']},
      hound:{w:32,h:32,c:['#3a2a1a','#1a1008','#5a4a3a','#ff0000','#f5d0a9']},
      giant:{w:40,h:40,c:['#6b5a4a','#4a3a2a','#2a1a0a','#1a0f05','#ff4400']},
      goblin:{w:24,h:24,c:['#2d6b1e','#1a4a10','#0f2a08','#ff0000','#8b4513']},
      stone_golem:{w:40,h:40,c:['#6a6a6a','#4a4a4a','#3a3a3a','#2a2a2a','#88aa00']},
      ghost:{w:32,h:32,c:['#e0e0f0','#c0c0e0','#f0f0ff','#ffffff','#0000aa']},
      skeleton:{w:32,h:32,c:['#d4c8a0','#b8a880','#fff8e0','#000000','#8b0000']},
      yeti:{w:32,h:32,c:['#f0f0f0','#e0e0e0','#d0d0d0','#4a6a8a','#ff6600']},
      ice_queen:{w:32,h:32,c:['#a0c0f0','#6080c0','#e0f0ff','#ffffff','#ffd700']},
      gorgon:{w:40,h:40,c:['#2d6a2d','#1a4a1a','#0a2a0a','#f5d0a9','#2d9a2d']},
      balrog:{w:40,h:40,c:['#8b0000','#4a0000','#ff4400','#ffaa00','#2a2a2a']},
      worm:{w:32,h:24,c:['#6b4a2a','#4a2a1a','#8b6a4a','#ff6600','#ff0000']},
      snake:{w:32,h:24,c:['#2d6a3a','#1a4a2a','#4a8a5a','#ff0000','#ff6600']},
      killer_bee:{w:24,h:24,c:['#ffcc00','#1a1a1a','#ffaa00','#ffffff','#cccccc']},
      scorpion:{w:28,h:24,c:['#8b4a1e','#5c3010','#c07030','#ff0000','#1a0e00']},
      imp:{w:24,h:24,c:['#8b0000','#4a0000','#2a0000','#000000','#ffaa00']},
      hell_spider:{w:36,h:30,c:['#8b0000','#4a0000','#2a0000','#ff4400','#ffaa00']},
      lich:{w:32,h:36,c:['#2a1a4a','#1a0a2a','#6a4a8a','#a0e0a0','#ffffff']},
      death_knight:{w:36,h:40,c:['#1a1a2a','#0a0a1a','#4a4a6a','#ff0000','#c0c0c0']},
      shadow:{w:32,h:32,c:['#1a1a2a','#0a0a1a','#2a2a4a','#ff0000','#ffffff']},
      demon:{w:40,h:40,c:['#6a0000','#3a0000','#8b2020','#ff6600','#1a1a1a']},
      ice_giant:{w:40,h:40,c:['#a0c0e0','#6080b0','#e0f0ff','#4060a0','#ffffff']},
      lava_giant:{w:40,h:40,c:['#ff4400','#8b1a00','#ff6600','#ffaa00','#1a0e00']},
      dark_elf:{w:32,h:32,c:['#2a1a4a','#1a0a2a','#4a2a6a','#f5d0a9','#000000']},
      wind_ghost:{w:32,h:32,c:['#c0e0f0','#a0c0e0','#e0f8ff','#80a0c0','#ffffff']},
      fire_phoenix:{w:40,h:36,c:['#ff4400','#ff6600','#ffaa00','#ffff00','#8b1a00']},
      thunder_bird:{w:36,h:32,c:['#ffff00','#ffaa00','#4488ff','#ffffff','#1a1a1a']},
      hydra:{w:40,h:36,c:['#1a6a2a','#0a3a15','#2d8a4e','#ff0000','#8b4513']},
      chimera:{w:40,h:36,c:['#8b4513','#4a2510','#ff4400','#2d8a4e','#ffaa00']},
      wyvern:{w:40,h:36,c:['#1a5a2a','#0d3d15','#ff6600','#ffaa00','#2d8a4e']},
      beholder:{w:32,h:32,c:['#6a3a8a','#4a1a6a','#ff0000','#ffffff','#000000']},
      dark_giant:{w:40,h:40,c:['#2a1a2a','#1a0a1a','#4a2a3a','#ff0000','#8b0000']},
      dragon:{w:40,h:36,c:['#8b0000','#4a0000','#ff4400','#ffaa00','#1a5a2a']},
      golden_goblin:{w:24,h:24,c:['#ffd700','#b8860b','#daa520','#ff0000','#8b4513']}
    };
    let d = m[monsterId] || {w:32,h:32,c:['#666','#444','#888','#aaa','#f0f']};
    let w = d.w, h = d.h, c = d.c;
    const cv = this.createCanvas(w, h);
    const cx = cv.getContext('2d');

    function R(x,y,w,h,color){ cx.fillStyle=color; cx.fillRect(x,y,w,h); }

    switch (monsterId) {
      case 'spider':
        R(8,9,8,7,c[0]);R(9,8,6,9,c[0]);R(10,7,4,11,c[0]);
        R(10,5,4,3,c[1]);R(11,4,2,2,c[1]);
        R(10,5,1,1,c[4]);R(13,5,1,1,c[4]);
        R(4,9,5,1,c[2]);R(4,11,6,1,c[2]);R(5,13,6,1,c[2]);R(6,15,6,1,c[2]);
        R(15,9,5,1,c[2]);R(14,11,6,1,c[2]);R(13,13,6,1,c[2]);R(12,15,6,1,c[2]);
        R(11,10,2,2,c[3]);R(10,12,4,1,c[3]);
        break;
      case 'budge_dragon':
        R(10,12,12,10,c[0]);R(11,10,10,12,c[0]);R(12,9,8,14,c[0]);
        R(12,5,8,6,c[0]);R(13,4,6,2,c[0]);
        R(14,8,4,3,c[1]);
        R(13,6,2,2,c[4]);R(17,6,2,2,c[4]);R(14,6,1,1,'#000');R(18,6,1,1,'#000');
        R(6,10,5,2,c[2]);R(5,8,6,3,c[2]);R(21,10,5,2,c[2]);R(21,8,6,3,c[2]);
        R(6,10,3,2,c[1]);R(23,10,3,2,c[1]);
        R(13,14,6,4,c[3]);
        R(14,22,4,3,c[0]);R(15,24,2,2,c[0]);
        R(12,22,3,2,c[1]);R(17,22,3,2,c[1]);
        break;
      case 'bull_fighter':
        R(10,12,12,10,c[0]);R(11,11,10,11,c[0]);R(12,10,8,12,c[0]);
        R(11,5,10,7,c[1]);R(12,4,8,2,c[1]);
        R(12,8,8,4,c[2]);R(13,11,6,2,c[2]);
        R(14,10,1,1,c[1]);R(17,10,1,1,c[1]);
        R(12,6,2,2,'#fff');R(18,6,2,2,'#fff');
        R(13,6,1,1,'#000');R(19,6,1,1,'#000');
        R(10,3,3,3,'#aaa');R(19,3,3,3,'#aaa');R(9,4,2,2,'#aaa');R(21,4,2,2,'#aaa');
        R(11,22,4,5,c[1]);R(17,22,4,5,c[1]);
        R(11,26,4,2,'#222');R(17,26,4,2,'#222');
        R(14,22,4,3,c[0]);R(15,24,2,2,c[0]);
        break;
      case 'hound':
        R(8,14,16,10,c[0]);R(9,12,14,12,c[0]);R(10,11,12,13,c[0]);
        R(10,5,10,8,c[1]);R(11,4,8,2,c[1]);
        R(11,8,8,4,c[2]);
        R(11,6,2,2,c[3]);R(18,6,2,2,c[3]);
        R(12,6,1,1,'#fff');R(19,6,1,1,'#fff');
        R(9,3,3,4,c[1]);R(20,3,3,4,c[1]);
        R(10,24,4,6,c[1]);R(18,24,4,6,c[1]);
        R(10,29,4,3,c[2]);R(18,29,4,3,c[2]);
        R(20,20,6,2,c[0]);R(22,18,4,3,c[0]);
        break;
      case 'giant':
        R(14,16,12,12,c[0]);R(15,14,10,14,c[0]);
        R(14,4,12,11,c[1]);R(15,3,10,2,c[1]);
        R(15,7,10,7,c[2]);
        R(16,6,3,3,'#fff');R(21,6,3,3,'#fff');
        R(17,7,1,1,'#000');R(22,7,1,1,'#000');
        R(17,12,6,2,c[3]);R(18,12,4,1,'#fff');
        R(8,14,6,4,c[1]);R(26,14,6,4,c[1]);R(7,17,7,5,c[1]);R(26,17,7,5,c[1]);
        R(7,21,7,4,c[2]);R(26,21,7,4,c[2]);
        R(15,28,5,8,c[1]);R(20,28,5,8,c[1]);
        R(14,35,7,5,c[2]);R(19,35,7,5,c[2]);
        R(15,26,10,4,c[3]);
        break;
      case 'goblin':
        R(9,8,6,6,c[0]);R(10,7,4,7,c[0]);
        R(9,2,6,6,c[1]);R(10,1,4,2,c[1]);
        R(7,3,2,3,c[2]);R(15,3,2,3,c[2]);
        R(10,4,1,1,c[3]);R(13,4,1,1,c[3]);
        R(11,6,2,1,'#000');
        R(9,10,6,2,c[4]);
        R(10,14,2,5,c[1]);R(12,14,2,5,c[1]);
        R(9,18,3,2,c[2]);R(12,18,3,2,c[2]);
        R(6,8,3,2,c[0]);R(15,8,3,2,c[0]);
        break;
      case 'stone_golem':
        R(12,14,16,14,c[0]);R(13,12,14,16,c[0]);
        R(13,4,14,10,c[1]);R(14,3,12,2,c[1]);
        R(15,7,10,6,c[2]);
        R(16,6,3,2,c[4]);R(21,6,3,2,c[4]);
        R(17,6,1,1,'#ccff00');R(22,6,1,1,'#ccff00');
        R(17,11,6,2,'#111');
        R(6,14,6,6,c[0]);R(28,14,6,6,c[0]);R(5,19,7,6,c[0]);R(28,19,7,6,c[0]);
        R(5,24,7,5,c[1]);R(28,24,7,5,c[1]);
        R(15,28,5,8,c[1]);R(20,28,5,8,c[1]);
        R(14,35,7,5,c[2]);R(19,35,7,5,c[2]);
        R(18,16,4,2,c[3]);R(16,20,2,4,c[3]);R(22,18,2,3,c[3]);
        break;
      case 'ghost':
        R(10,8,12,16,c[0]);R(11,6,10,18,c[0]);R(12,5,8,19,c[0]);R(13,4,6,20,c[0]);
        R(9,22,14,3,c[0]);R(10,24,12,3,c[0]);R(11,26,10,2,c[0]);
        R(12,9,3,4,c[4]);R(17,9,3,4,c[4]);
        R(13,10,1,2,'#000');R(18,10,1,2,'#000');
        R(14,15,4,2,c[4]);
        R(6,10,5,3,c[1]);R(5,13,6,2,c[1]);R(21,10,5,3,c[1]);R(21,13,6,2,c[1]);
        R(13,6,6,3,c[2]);R(14,17,4,4,c[2]);
        break;
      case 'skeleton':
        R(12,10,8,10,c[0]);R(13,8,6,12,c[0]);
        R(12,2,8,8,c[1]);R(13,1,6,2,c[1]);
        R(13,4,2,2,'#000');R(17,4,2,2,'#000');
        R(14,7,4,2,'#111');
        R(15,7,1,1,c[1]);R(17,7,1,1,c[1]);
        R(12,11,2,6,c[2]);R(18,11,2,6,c[2]);R(14,12,4,1,c[2]);R(14,14,4,1,c[2]);
        R(8,10,4,2,c[0]);R(20,10,4,2,c[0]);R(7,12,5,4,c[0]);R(20,12,5,4,c[0]);
        R(7,16,5,3,c[1]);R(20,16,5,3,c[1]);
        R(13,20,3,6,c[0]);R(16,20,3,6,c[0]);
        R(12,26,4,2,c[1]);R(16,26,4,2,c[1]);
        R(21,8,2,10,c[1]);R(20,6,4,3,c[1]);
        break;
      case 'yeti':
        R(10,12,12,12,c[0]);R(11,10,10,14,c[0]);
        R(11,2,10,10,c[1]);R(12,1,8,2,c[1]);
        R(13,5,6,5,c[2]);
        R(13,4,2,2,c[4]);R(17,4,2,2,c[4]);
        R(14,4,1,1,'#000');R(18,4,1,1,'#000');
        R(14,8,4,2,'#000');
        R(15,8,1,1,'#fff');R(16,8,1,1,'#fff');
        R(4,12,6,4,c[1]);R(22,12,6,4,c[1]);R(3,16,7,5,c[1]);R(22,16,7,5,c[1]);
        R(3,21,7,4,c[2]);R(22,21,7,4,c[2]);
        R(14,16,4,2,c[3]);R(12,18,8,2,c[3]);
        R(12,24,4,6,c[1]);R(16,24,4,6,c[1]);
        R(11,29,5,3,c[2]);R(16,29,5,3,c[2]);
        break;
      case 'ice_queen':
        R(12,12,8,10,c[0]);R(13,10,6,12,c[0]);
        R(12,2,8,9,'#f5d0a9');R(13,1,6,2,'#f5d0a9');
        R(11,0,10,3,c[4]);R(12,-1,8,2,c[4]);R(13,-2,6,2,c[4]);R(15,-3,2,1,c[4]);
        R(13,1,1,1,'#f00');R(18,1,1,1,'#f00');R(15,0,2,1,'#f00');
        R(13,5,2,1,'#000');R(17,5,2,1,'#000');
        R(14,7,4,1,'#c04040');
        R(11,1,2,5,c[1]);R(19,1,2,5,c[1]);
        R(11,20,10,4,c[1]);R(10,22,12,4,c[1]);R(9,24,14,4,c[1]);
        R(16,14,2,4,c[2]);R(13,16,6,2,c[2]);
        R(8,12,4,3,'#f5d0a9');R(20,12,4,3,'#f5d0a9');R(7,14,5,4,'#f5d0a9');R(20,14,5,4,'#f5d0a9');
        R(22,4,2,16,c[2]);
        R(21,3,4,3,c[4]);R(22,2,2,2,c[4]);
        break;
      case 'gorgon':
        R(14,16,12,12,c[0]);R(15,14,10,14,c[0]);
        R(15,4,10,11,c[3]);R(16,3,8,2,c[3]);
        for (let i=0;i<6;i++){let sx=12+i*3;R(sx,0,2,4,c[1]);R(sx-1,1,3,2,c[1]);R(sx,0,1,1,c[4]);R(sx+1,1,1,1,c[4]);R(sx,0,1,1,'#f00');}
        R(17,6,2,1,'#f00');R(21,6,2,1,'#f00');R(17,6,1,1,'#000');R(22,6,1,1,'#000');
        R(18,10,4,2,'#000');R(19,10,1,1,'#fff');R(20,10,1,1,'#fff');
        R(16,16,8,4,c[0]);R(17,18,2,2,c[2]);R(21,18,2,2,c[2]);
        R(10,16,4,3,c[3]);R(26,16,4,3,c[3]);
        R(16,28,8,4,c[1]);R(14,30,12,4,c[1]);R(12,32,16,4,c[1]);R(10,34,20,3,c[1]);
        break;
      case 'balrog':
        R(14,16,12,12,c[0]);R(15,14,10,14,c[0]);
        R(14,4,12,12,c[1]);R(15,3,10,2,c[1]);
        R(12,0,4,5,c[4]);R(24,0,4,5,c[4]);R(13,-1,3,5,c[4]);R(24,-1,3,5,c[4]);
        R(16,6,3,3,c[3]);R(21,6,3,3,c[3]);R(17,7,1,1,'#fff');R(22,7,1,1,'#fff');
        R(17,11,6,3,c[2]);R(18,12,4,1,'#000');
        R(4,10,10,4,c[4]);R(2,12,12,6,c[4]);R(26,10,10,4,c[4]);R(26,12,12,6,c[4]);
        R(6,12,6,4,c[1]);R(28,12,6,4,c[1]);
        R(8,16,6,4,c[0]);R(26,16,6,4,c[0]);
        R(12,28,16,4,c[2]);R(10,30,20,4,c[2]);R(8,32,24,4,c[2]);
        R(16,28,4,6,c[1]);R(20,28,4,6,c[1]);R(16,33,4,3,'#000');R(20,33,4,3,'#000');
        R(24,16,8,2,c[2]);R(28,17,6,2,c[2]);R(30,18,4,2,c[2]);
        break;
      case 'worm':
        R(4,10,24,6,c[0]);R(5,9,22,8,c[0]);R(6,8,20,10,c[0]);
        R(6,10,4,6,c[1]);R(12,10,4,6,c[1]);R(18,10,4,6,c[1]);R(24,10,4,6,c[1]);
        R(4,8,6,8,c[2]);R(3,9,2,6,c[2]);
        R(4,9,2,2,'#fff');R(5,9,1,1,'#000');
        R(3,12,2,2,c[4]);R(3,13,2,1,'#000');
        R(4,6,1,2,c[0]);R(7,6,1,2,c[0]);
        break;
      case 'snake':
        R(4,8,24,6,c[0]);R(5,7,22,8,c[0]);R(6,6,20,10,c[0]);
        R(8,8,4,4,c[1]);R(16,8,4,4,c[1]);R(24,8,4,4,c[1]);
        R(4,6,8,8,c[2]);R(3,7,2,6,c[2]);
        R(5,7,2,2,c[3]);R(9,7,2,2,c[3]);R(6,7,1,1,'#000');R(10,7,1,1,'#000');
        R(2,10,2,1,c[4]);R(1,9,1,1,c[4]);R(1,11,1,1,c[4]);
        R(26,8,4,4,c[0]);R(28,9,3,2,c[0]);R(30,10,2,1,c[0]);
        break;
      case 'killer_bee':
        R(8,8,8,8,c[1]);R(9,7,6,10,c[1]);
        R(8,9,8,2,c[0]);R(8,13,8,2,c[0]);
        R(10,3,4,5,c[1]);R(11,2,2,2,c[1]);
        R(10,4,2,2,c[3]);R(12,4,2,2,c[3]);R(11,4,1,1,'#000');R(13,4,1,1,'#000');
        R(8,4,8,2,c[4]);R(6,2,4,4,c[4]);R(14,2,4,4,c[4]);
        R(14,11,3,2,'#000');R(16,12,2,1,'#000');R(9,15,2,4,'#000');R(13,15,2,4,'#000');
        break;
      case 'scorpion':
        R(8,8,12,8,c[0]);R(9,7,10,10,c[0]);
        R(9,9,3,6,c[1]);R(14,9,3,6,c[1]);
        R(7,8,4,6,c[2]);R(6,9,2,4,c[2]);
        R(8,8,1,1,c[3]);R(10,8,1,1,c[3]);
        R(2,9,5,2,c[2]);R(1,8,2,4,c[2]);R(17,9,5,2,c[2]);R(21,8,2,4,c[2]);
        R(10,15,2,5,c[4]);R(14,15,2,5,c[4]);
        R(18,6,6,3,c[0]);R(22,4,4,4,c[0]);R(24,2,3,4,c[0]);
        R(25,1,2,3,c[3]);R(26,0,1,2,c[3]);
        break;
      case 'imp':
        R(9,8,6,6,c[0]);R(10,7,4,7,c[0]);
        R(9,2,6,6,c[1]);R(10,1,4,2,c[1]);
        R(8,0,3,3,c[2]);R(13,0,3,3,c[2]);
        R(10,4,1,1,c[4]);R(13,4,1,1,c[4]);R(10,6,4,1,'#000');
        R(5,6,4,3,c[2]);R(15,6,4,3,c[2]);
        R(12,14,2,4,c[0]);R(13,17,3,2,c[0]);R(15,18,1,1,c[0]);
        R(10,14,2,4,c[1]);R(12,14,2,4,c[1]);
        R(10,17,2,2,c[2]);R(12,17,2,2,c[2]);
        break;
      case 'hell_spider':
        R(10,12,16,10,c[0]);R(11,10,14,12,c[0]);R(12,9,12,13,c[0]);
        R(12,5,12,6,c[1]);R(14,4,8,2,c[1]);
        R(12,6,2,2,c[4]);R(22,6,2,2,c[4]);R(15,5,2,2,c[4]);R(19,5,2,2,c[4]);R(17,7,2,1,c[4]);
        R(14,9,3,2,c[2]);R(19,9,3,2,c[2]);
        R(14,13,8,2,c[2]);R(16,11,4,6,c[2]);R(15,14,6,1,c[3]);
        R(2,11,9,2,c[1]);R(3,14,8,2,c[1]);R(4,17,8,2,c[1]);R(5,20,7,2,c[1]);
        R(25,11,9,2,c[1]);R(25,14,8,2,c[1]);R(24,17,8,2,c[1]);R(24,20,7,2,c[1]);
        break;
      case 'lich':
        R(12,10,8,14,c[0]);R(13,8,6,16,c[0]);
        R(12,2,8,8,'#d4c8a0');R(13,1,6,2,'#d4c8a0');
        R(13,4,2,2,'#000');R(17,4,2,2,'#000');
        R(13,4,1,1,c[3]);R(18,4,1,1,c[3]);
        R(14,7,4,2,'#000');
        R(11,0,10,3,c[1]);R(10,3,12,2,c[1]);
        R(11,18,10,8,c[2]);R(10,22,12,8,c[2]);R(9,26,14,6,c[2]);
        R(8,10,4,2,'#d4c8a0');R(20,10,4,2,'#d4c8a0');R(7,12,5,4,'#d4c8a0');R(20,12,5,4,'#d4c8a0');
        R(22,2,2,20,'#4a2a1a');R(21,1,4,3,c[3]);R(22,-1,2,2,c[3]);
        break;
      case 'death_knight':
        R(14,14,8,12,c[0]);R(15,12,6,14,c[0]);
        R(14,4,8,9,c[1]);R(15,3,6,2,c[1]);
        R(13,2,10,3,c[0]);R(12,4,12,2,c[0]);
        R(14,6,8,1,c[3]);R(15,5,6,2,c[3]);
        R(12,0,3,3,c[2]);R(21,0,3,3,c[2]);
        R(14,12,8,8,c[0]);R(16,14,4,2,c[3]);R(17,12,2,6,c[3]);
        R(10,12,4,3,c[2]);R(22,12,4,3,c[2]);
        R(8,14,4,6,c[0]);R(24,14,4,6,c[0]);
        R(26,8,2,14,c[4]);R(27,6,1,4,c[4]);R(25,11,4,2,'#8b4513');
        R(15,26,3,6,c[1]);R(18,26,3,6,c[1]);
        R(14,31,4,3,c[2]);R(18,31,4,3,c[2]);
        R(12,14,12,2,c[3]);R(11,16,14,6,c[3]);R(10,22,16,8,c[3]);
        break;
      case 'shadow':
        R(10,6,12,18,c[0]);R(11,4,10,20,c[0]);R(12,3,8,21,c[0]);
        R(12,1,8,6,c[0]);R(13,0,6,2,c[0]);
        R(13,3,2,2,c[3]);R(17,3,2,2,c[3]);R(14,3,1,1,c[4]);R(18,3,1,1,c[4]);
        R(4,8,7,3,c[1]);R(3,10,8,2,c[1]);R(21,8,7,3,c[1]);R(21,10,8,2,c[1]);
        R(11,24,4,6,c[1]);R(17,24,4,6,c[1]);
        R(10,28,12,3,c[2]);R(9,30,14,2,c[2]);
        break;
      case 'demon':
        R(14,16,12,12,c[0]);R(15,14,10,14,c[0]);
        R(14,4,12,12,c[1]);R(15,3,10,2,c[1]);
        R(12,0,4,5,c[4]);R(24,0,4,5,c[4]);R(13,-1,3,5,c[4]);R(24,-1,3,5,c[4]);
        R(16,6,3,3,c[2]);R(21,6,3,3,c[2]);R(17,7,1,1,'#000');R(22,7,1,1,'#000');
        R(17,11,6,2,'#000');R(18,11,4,1,'#fff');
        R(2,8,12,6,c[4]);R(0,10,14,8,c[4]);R(26,8,12,6,c[4]);R(26,10,14,8,c[4]);
        R(8,16,6,4,c[0]);R(26,16,6,4,c[0]);
        R(7,20,7,3,c[4]);R(26,20,7,3,c[4]);
        R(12,30,16,4,c[2]);R(10,32,20,4,c[2]);
        R(16,28,4,6,c[1]);R(20,28,4,6,c[1]);R(16,33,4,3,'#000');R(20,33,4,3,'#000');
        break;
      case 'ice_giant':
        R(14,14,12,12,c[0]);R(15,12,10,14,c[0]);
        R(14,2,12,11,c[1]);R(15,1,10,2,c[1]);
        R(15,10,10,3,c[4]);R(16,12,8,2,c[4]);R(17,13,6,2,c[4]);
        R(16,5,3,2,c[2]);R(21,5,3,2,c[2]);R(17,5,1,1,'#fff');R(22,5,1,1,'#fff');
        R(13,0,14,2,c[4]);R(14,-1,12,1,c[4]);
        R(16,16,8,2,c[2]);R(15,20,10,2,c[2]);R(17,18,6,2,c[2]);
        R(8,14,6,4,c[1]);R(26,14,6,4,c[1]);
        R(7,18,7,5,c[0]);R(26,18,7,5,c[0]);
        R(15,26,5,8,c[1]);R(20,26,5,8,c[1]);
        R(14,33,6,5,c[0]);R(20,33,6,5,c[0]);
        break;
      case 'lava_giant':
        R(14,14,12,12,c[0]);R(15,12,10,14,c[0]);
        R(14,2,12,11,'#4a1a00');R(15,1,10,2,'#4a1a00');
        R(16,5,3,3,c[3]);R(21,5,3,3,c[3]);R(17,6,1,1,'#fff');R(22,6,1,1,'#fff');
        R(17,10,6,3,c[3]);R(18,11,4,1,c[2]);
        R(16,16,2,4,c[2]);R(22,16,2,4,c[2]);R(18,18,4,2,c[2]);R(17,22,6,2,c[2]);
        R(8,14,6,4,'#4a1a00');R(26,14,6,4,'#4a1a00');
        R(7,18,7,5,c[0]);R(26,18,7,5,c[0]);R(8,19,2,2,c[2]);R(27,19,2,2,c[2]);
        R(15,26,5,8,'#4a1a00');R(20,26,5,8,'#4a1a00');
        R(17,28,1,4,c[2]);R(22,28,1,4,c[2]);
        R(14,33,6,5,c[0]);R(20,33,6,5,c[0]);
        break;
      case 'dark_elf':
        R(12,12,8,10,c[0]);R(13,10,6,12,c[0]);
        R(12,2,8,9,c[3]);R(13,1,6,2,c[3]);
        R(11,0,10,4,c[4]);R(10,3,12,3,c[4]);
        R(13,5,2,1,'#f00');R(17,5,2,1,'#f00');R(14,7,4,1,'#000');
        R(9,3,3,3,c[3]);R(20,3,3,3,c[3]);R(8,4,2,2,c[3]);R(22,4,2,2,c[3]);
        R(12,14,8,4,c[1]);R(11,18,10,4,c[1]);R(10,20,12,6,c[1]);
        R(8,12,4,3,c[3]);R(20,12,4,3,c[3]);
        R(7,10,2,8,c[4]);R(5,11,3,6,c[4]);R(6,9,1,10,c[4]);
        break;
      case 'wind_ghost':
        R(10,8,12,14,c[0]);R(11,6,10,16,c[0]);R(12,5,8,17,c[0]);
        R(11,3,10,4,c[1]);R(12,2,8,2,c[1]);
        R(12,7,3,3,c[3]);R(17,7,3,3,c[3]);R(13,8,1,1,'#000');R(18,8,1,1,'#000');
        R(13,11,6,3,c[2]);R(12,15,8,2,c[2]);
        R(6,10,5,2,c[1]);R(4,12,7,1,c[1]);R(21,10,5,2,c[1]);R(21,12,7,1,c[1]);
        R(10,22,12,4,c[2]);R(9,25,14,3,c[2]);R(10,27,12,2,c[2]);
        break;
      case 'fire_phoenix':
        R(12,12,16,10,c[0]);R(13,10,14,12,c[0]);
        R(14,12,12,6,c[3]);R(15,10,10,8,c[3]);
        R(16,4,8,7,c[1]);R(17,3,6,2,c[1]);
        R(17,0,6,4,c[2]);R(18,-1,4,3,c[2]);R(19,-2,2,2,c[2]);
        R(14,6,3,2,c[3]);R(17,5,2,2,'#000');R(21,5,2,2,'#000');
        R(4,8,10,6,c[0]);R(2,10,12,8,c[0]);R(26,8,10,6,c[0]);R(26,10,12,8,c[0]);
        R(4,10,6,4,c[2]);R(30,10,6,4,c[2]);
        R(14,22,12,4,c[0]);R(12,24,16,4,c[0]);R(10,26,20,4,c[0]);R(8,28,24,4,c[0]);
        R(14,24,4,2,c[2]);R(22,24,4,2,c[2]);R(16,26,8,2,c[3]);
        R(19,20,2,4,c[3]);R(23,20,2,4,c[3]);R(18,23,3,2,'#000');R(23,23,3,2,'#000');
        break;
      case 'thunder_bird':
        R(12,10,12,10,c[0]);R(13,8,10,12,c[0]);
        R(14,10,8,6,c[1]);
        R(14,2,8,8,c[4]);R(15,1,6,2,c[4]);
        R(11,4,4,2,c[1]);R(15,3,2,2,c[3]);R(19,3,2,2,c[3]);
        R(16,3,1,1,'#000');R(20,3,1,1,'#000');
        R(16,-1,4,3,c[0]);R(17,-2,2,2,c[0]);
        R(4,8,8,4,c[4]);R(3,10,9,6,c[4]);R(24,8,8,4,c[4]);R(24,10,9,6,c[4]);
        R(4,9,4,2,c[3]);R(28,9,4,2,c[3]);
        R(14,20,8,4,c[4]);R(12,22,12,4,c[4]);R(10,24,16,4,c[4]);
        R(14,22,4,2,c[3]);R(18,24,4,2,c[3]);
        R(16,18,2,4,c[1]);R(18,18,2,4,c[1]);
        break;
      case 'hydra':
        R(10,14,20,12,c[0]);R(11,12,18,14,c[0]);
        R(14,14,12,8,c[2]);R(16,18,8,4,c[3]);
        [10,16,22].forEach((hx)=>{let hy=hx===16?0:2;
          R(hx,hy,6,6,c[0]);R(hx+1,hy-1,4,2,c[0]);
          R(hx+1,hy+1,2,1,'#fff');R(hx+3,hy+1,2,1,'#fff');
          R(hx+2,hy+1,1,1,'#000');R(hx+4,hy+1,1,1,'#000');
          R(hx+1,hy+4,4,1,c[3]);R(hx+1,hy+3,4,2,c[1]);
          R(hx+2,hy+4,1,1,'#fff');R(hx+4,hy+4,1,1,'#fff');
          R(hx+1,hy+5,4,4,c[0]);});
        R(12,26,4,6,c[1]);R(24,26,4,6,c[1]);R(16,26,3,6,c[1]);R(21,26,3,6,c[1]);
        R(8,24,6,3,c[0]);R(26,24,6,3,c[0]);
        break;
      case 'chimera':
        R(12,14,16,10,c[0]);R(13,12,14,12,c[0]);
        R(10,3,12,10,c[1]);R(11,2,10,2,c[1]);
        R(8,2,4,6,c[2]);R(20,2,4,6,c[2]);R(9,1,14,2,c[2]);
        R(12,5,2,2,'#fff');R(18,5,2,2,'#fff');R(13,5,1,1,'#000');R(19,5,1,1,'#000');
        R(13,7,6,4,c[0]);R(14,9,4,2,'#000');R(14,9,1,1,'#fff');R(17,9,1,1,'#fff');
        R(15,7,2,1,'#000');
        R(18,16,10,4,c[1]);R(14,24,4,6,c[0]);R(20,24,4,6,c[0]);
        R(14,29,4,2,'#222');R(20,29,4,2,'#222');
        R(24,16,8,3,c[2]);R(28,18,6,3,c[2]);R(30,20,4,3,c[2]);
        R(32,18,2,2,c[3]);R(31,21,2,2,c[3]);
        break;
      case 'wyvern':
        R(12,12,14,10,c[0]);R(13,10,12,12,c[0]);
        R(14,12,10,6,c[4]);R(14,3,10,8,c[0]);R(15,2,8,2,c[0]);
        R(12,5,4,4,c[1]);R(17,4,2,2,c[2]);R(18,4,1,1,'#000');
        R(14,1,3,3,c[1]);R(21,1,3,3,c[1]);
        R(4,8,10,4,c[1]);R(3,10,11,6,c[1]);R(24,8,10,4,c[1]);R(24,10,11,6,c[1]);
        R(4,10,8,3,c[3]);R(26,10,8,3,c[3]);
        R(16,22,3,6,c[0]);R(20,22,3,6,c[0]);R(16,27,3,2,'#000');R(20,27,3,2,'#000');
        R(22,16,8,3,c[0]);R(26,18,6,3,c[0]);R(28,20,4,3,c[0]);
        R(30,20,2,2,c[2]);
        break;
      case 'beholder':
        R(8,8,16,16,c[0]);R(9,6,14,20,c[0]);R(10,5,12,22,c[0]);
        R(12,10,8,8,'#fff');R(13,9,6,10,'#fff');
        R(14,12,4,4,c[3]);R(15,13,2,2,'#000');R(15,12,1,1,'#fff');
        for(let i=0;i<5;i++){let a=(i/5)*Math.PI*2;let sx=16+Math.round(Math.cos(a)*14),sy=16+Math.round(Math.sin(a)*14);
          R(sx,sy,3,3,c[1]);let mx=16+Math.round(Math.cos(a)*8),my=16+Math.round(Math.sin(a)*8);
          R(Math.min(sx,mx),Math.min(sy,my),Math.abs(sx-mx)+1,Math.abs(sy-my)+1,c[1]);
          R(sx+1,sy+1,1,1,c[3]);}
        R(14,20,4,1,'#000');R(14,19,1,1,'#fff');R(17,19,1,1,'#fff');
        break;
      case 'dark_giant':
        R(14,16,12,12,c[0]);R(15,14,10,14,c[0]);
        R(14,4,12,11,c[1]);R(15,3,10,2,c[1]);
        R(15,7,10,7,c[2]);R(16,6,3,2,c[3]);R(21,6,3,2,c[3]);
        R(17,6,1,1,'#000');R(22,6,1,1,'#000');R(17,11,6,2,'#000');
        R(12,16,16,2,c[1]);R(11,18,18,4,c[1]);
        R(8,14,6,4,c[1]);R(26,14,6,4,c[1]);R(7,18,7,5,c[2]);R(26,18,7,5,c[2]);
        R(15,28,5,8,c[1]);R(20,28,5,8,c[1]);R(14,35,6,5,c[2]);R(20,35,6,5,c[2]);
        R(18,16,4,2,c[3]);R(16,20,2,2,c[3]);R(22,20,2,2,c[3]);
        break;
      case 'dragon':
        R(12,14,16,10,c[0]);R(13,12,14,12,c[0]);
        R(14,14,12,6,c[4]);R(16,16,8,4,'#fc0');
        R(14,3,12,10,c[0]);R(15,2,10,2,c[0]);
        R(12,5,4,5,c[1]);R(13,6,1,1,'#000');R(15,6,1,1,'#000');
        R(8,6,5,2,c[2]);R(6,5,3,4,c[2]);R(9,7,3,1,c[3]);
        R(17,4,3,2,c[3]);R(22,4,3,2,c[3]);R(18,4,1,1,'#000');R(23,4,1,1,'#000');
        R(14,0,4,4,'#222');R(22,0,4,4,'#222');
        R(4,8,10,4,c[1]);R(3,10,11,6,c[1]);R(26,8,10,4,c[1]);R(26,10,11,6,c[1]);
        R(4,10,8,3,c[2]);R(28,10,8,3,c[2]);
        R(15,24,4,6,c[0]);R(21,24,4,6,c[0]);R(15,29,4,2,'#fff');R(21,29,4,2,'#fff');
        R(24,16,8,4,c[0]);R(28,18,6,4,c[0]);R(30,20,4,4,c[0]);
        R(32,20,3,3,c[1]);R(31,23,2,2,c[1]);
        R(14,12,2,2,c[1]);R(18,11,2,3,c[1]);R(22,12,2,2,c[1]);
        break;
      case 'golden_goblin':
        R(9,8,6,6,c[0]);R(10,7,4,7,c[0]);
        R(9,2,6,6,c[1]);R(10,1,4,2,c[1]);
        R(7,3,2,3,c[2]);R(15,3,2,3,c[2]);
        R(10,4,1,1,c[3]);R(13,4,1,1,c[3]);R(11,6,2,1,'#000');R(12,6,1,1,c[0]);
        R(10,10,4,2,c[2]);R(10,12,4,1,c[0]);
        R(10,14,2,5,c[1]);R(12,14,2,5,c[1]);
        R(9,18,3,2,c[0]);R(12,18,3,2,c[0]);
        R(8,20,2,1,c[0]);R(14,20,2,1,c[0]);R(9,21,2,1,c[0]);R(13,21,2,1,c[0]);
        break;
      default: {
        let bw=Math.floor(d.w*0.5),bh=Math.floor(d.h*0.4);
        let bx=Math.floor((d.w-bw)/2),by=Math.floor((d.h-bh)/2);
        R(bx,by,bw,bh,c[Math.floor(Math.random()*c.length)]);
        let hw=Math.floor(bw*0.6),hh=Math.floor(bh*0.5);
        R(bx+Math.floor((bw-hw)/2),by-hh,hw,hh,c[0]);
        R(bx+2,by-hh+2,2,2,'#fff');R(bx+bw-4,by-hh+2,2,2,'#fff');
        R(bx+3,by-hh+2,1,1,'#000');R(bx+bw-3,by-hh+2,1,1,'#000');
        R(bx+2,by+bh,3,Math.floor(d.h*0.25),'#000');
        R(bx+bw-5,by+bh,3,Math.floor(d.h*0.25),'#000');
      }
    }

    cx.fillStyle = 'rgba(0,0,0,0.2)';
    cx.fillRect(4, d.h - 3, d.w - 8, 2);

    return cv;
  },

  generateTile: function(tileType) {
    const size = 32;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

    switch (tileType) {
      case 'grass':
        R(0,0,32,32,'#3a7a2a');
        for (let i=0;i<20;i++){let gx=(i*7+3)%32,gy=(i*11+5)%32;R(gx,gy,2,2,i%3===0?'#4a8a3a':(i%3===1?'#2d6a1e':'#5a9a4a'));}
        for (let i=0;i<8;i++)R((i*13+7)%30+1,(i*17+11)%30+1,3,1,'#2d6a1e');
        break;
      case 'wall':
        R(0,0,32,32,'#6a6a6a');
        for (let r=0;r<8;r++){let y=r*4,off=(r%2)*16;for(let c=-1;c<4;c++){let x=c*16+off;R(x,y,14,3,'#5a5a5a');R(x+15,y,1,3,'#5a5a5a');}}
        for (let r=0;r<8;r++)R(0,r*4+3,32,1,'#4a4a4a');
        R(2,1,4,1,'#7a7a7a');R(18,5,4,1,'#7a7a7a');R(6,9,4,1,'#7a7a7a');R(22,13,4,1,'#7a7a7a');
        break;
      case 'water':
        R(0,0,32,32,'#1a5a8a');
        for (let r=0;r<6;r++){let y=r*6+1;for(let c=0;c<5;c++)R(c*7+(r%2)*3,y,5,2,r%2===0?'#2a7aaa':'#0a4a7a');}
        for (let i=0;i<5;i++)R((i*13+5)%28+2,(i*11+7)%28+2,2,1,'#4a9aca');
        break;
      case 'road':
        R(0,0,32,32,'#b8a070');
        for (let i=0;i<15;i++)R((i*7+3)%30+1,(i*11+5)%30+1,2,2,i%2===0?'#c8b080':'#a89060');
        R(6,0,3,32,'#9a8858');R(23,0,3,32,'#9a8858');
        break;
      case 'snow':
        R(0,0,32,32,'#e8e8f0');
        for (let i=0;i<25;i++)R((i*7+3)%32,(i*11+5)%32,2,2,i%3===0?'#ffffff':'#d8d8e8');
        R(8,6,5,4,'#d0e8f0');R(20,18,6,3,'#d0e8f0');R(4,22,4,3,'#d0e8f0');
        R(10,8,1,1,'#fff');R(22,19,1,1,'#fff');R(6,23,1,1,'#fff');
        break;
      case 'stone':
        R(0,0,32,32,'#7a7a7a');
        R(0,0,15,15,'#6a6a6a');R(16,0,16,15,'#6a6a6a');R(0,16,15,16,'#6a6a6a');R(16,16,16,16,'#6a6a6a');
        R(0,15,32,1,'#5a5a5a');R(15,0,1,32,'#5a5a5a');
        R(2,2,4,2,'#8a8a8a');R(18,3,4,2,'#8a8a8a');R(4,18,3,3,'#8a8a8a');R(20,20,4,2,'#8a8a8a');
        break;
      case 'tower':
        R(0,0,32,32,'#5a5a5a');
        for (let r=0;r<8;r++){let y=r*4,off=(r%2)*12;for(let c=-1;c<4;c++)R(c*12+off+1,y+1,10,2,'#4a4a4a');}
        R(14,0,4,32,'#3a3a3a');R(0,14,32,4,'#3a3a3a');
        break;
      case 'tree':
        R(0,0,32,32,'#3a7a2a');
        R(14,18,4,12,'#5c3a1e');R(12,28,2,3,'#5c3a1e');R(18,28,2,3,'#5c3a1e');
        R(8,6,16,8,'#1a5a0a');R(6,8,20,8,'#1a5a0a');R(8,4,16,6,'#1a5a0a');R(10,2,12,4,'#1a5a0a');
        R(10,5,4,3,'#2a7a1a');R(18,7,4,3,'#2a7a1a');R(12,10,8,3,'#2a7a1a');
        R(2,28,4,2,'#2d6a1e');R(26,26,3,2,'#2d6a1e');
        break;
      case 'sand':
        R(0,0,32,32,'#d4b878');
        for (let i=0;i<20;i++)R((i*7+3)%32,(i*11+5)%32,2,2,i%2===0?'#e4c888':'#c4a868');
        R(6,4,3,2,'#b09858');R(22,16,2,2,'#b09858');R(14,24,3,2,'#b09858');
        R(0,28,32,4,'#c0a868');
        break;
      case 'bridge':
        R(0,0,32,32,'#6b4a2a');
        R(0,0,32,6,'#7a5a3a');R(0,8,32,6,'#7a5a3a');R(0,16,32,6,'#7a5a3a');R(0,24,32,8,'#7a5a3a');
        R(0,6,32,2,'#4a2a1a');R(0,14,32,2,'#4a2a1a');R(0,22,32,2,'#4a2a1a');
        R(2,1,28,2,'#5a3a1a');R(2,27,28,2,'#5a3a1a');
        R(2,0,3,4,'#5a3a1a');R(14,0,3,4,'#5a3a1a');R(27,0,3,4,'#5a3a1a');
        R(2,27,3,5,'#5a3a1a');R(14,27,3,5,'#5a3a1a');R(27,27,3,5,'#5a3a1a');
        R(4,7,24,1,'#1a5a8a');R(6,15,20,1,'#1a5a8a');R(4,23,24,1,'#1a5a8a');
        break;
      case 'lava':
        R(0,0,32,32,'#8b1a00');
        for (let i=0;i<8;i++){let lx=(i*13+5)%30+1,ly=(i*17+7)%30+1;R(lx,ly,4,2,i%2===0?'#ff4400':'#ff6600');R(lx+2,ly-1,2,4,i%2===0?'#ff4400':'#ff6600');}
        R(6,4,2,2,'#ffaa00');R(20,14,2,2,'#ffaa00');R(12,24,2,2,'#ffaa00');
        R(0,0,32,1,'#ff4400');R(0,31,32,1,'#ff4400');
        break;
      case 'dark_stone':
        R(0,0,32,32,'#3a3a3a');
        R(0,0,10,8,'#2a2a2a');R(12,0,20,6,'#2a2a2a');R(0,10,14,12,'#2a2a2a');R(16,8,16,14,'#2a2a2a');R(0,24,32,8,'#2a2a2a');
        R(10,0,1,8,'#1a1a1a');R(12,7,1,3,'#1a1a1a');R(0,8,12,1,'#1a1a1a');
        R(16,7,1,2,'#1a1a1a');R(14,22,1,2,'#1a1a1a');R(0,22,14,1,'#1a1a1a');R(16,22,16,1,'#1a1a1a');
        break;
      default:
        R(0,0,32,32,'#f0f');
        for (let y=0;y<32;y+=4)for(let x=0;x<32;x+=8)R(x+((y/4)%2===0?0:4),y,4,4,'#000');
    }
    return canvas;
  },

  generateNPC: function(npcId) {
    const size = 32;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const skin = '#f5d0a9';
    let c1,c2,hair,type;

    switch (npcId) {
      case 'wandering_merchant': c1='#c07030';c2='#8b5020';hair='#8b4513';type='merchant';break;
      case 'weapon_smith': c1='#6a6a6a';c2='#4a4a4a';hair='#3a3a3a';type='smith';break;
      case 'armor_smith': c1='#8b6914';c2='#5c4a0e';hair='#2a1a0a';type='smith';break;
      case 'potion_maker': c1='#2d7a5a';c2='#1a4a3a';hair='#ffffff';type='alchemist';break;
      case 'guild_master': c1='#1a3a6a';c2='#0f2a4a';hair='#c0c0c0';type='noble';break;
      case 'gate_keeper': c1='#8b0000';c2='#4a0000';hair='#2a1a0a';type='guard';break;
      case 'sage': c1='#2a1a4a';c2='#1a0a2a';hair='#e0d0c0';type='sage';break;
      case 'priestess': c1='#f0e0c0';c2='#d0c0a0';hair='#c0a080';type='priestess';break;
      case 'tavern_owner': c1='#8b4513';c2='#5c2a0e';hair='#5c3a1e';type='tavern';break;
      default: c1='#666';c2='#444';hair='#333';type='common';
    }

    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

    // Head
    R(12,1,8,3,hair);R(11,3,10,3,hair);
    R(12,5,8,5,skin);
    R(13,7,2,1,'#000');R(17,7,2,1,'#000');
    R(14,10,4,1,'#c04040');

    switch (type) {
      case 'merchant':
        R(11,0,10,3,c1);R(10,3,12,1,c1);
        R(13,11,6,3,hair);R(14,13,4,2,hair);
        break;
      case 'smith':
        R(13,11,6,2,hair);R(14,12,4,3,hair);
        R(12,1,8,4,skin);
        R(13,14,6,8,c2);
        break;
      case 'alchemist':
        R(12,0,8,2,c1);R(13,1,6,2,c1);R(14,2,4,2,c1);R(15,3,2,1,c1);
        R(12,6,3,2,'#888');R(17,6,3,2,'#888');R(15,7,2,1,'#888');
        R(11,14,10,10,c1);
        break;
      case 'noble':
        R(12,0,8,3,'#ffd700');R(13,-1,6,2,'#ffd700');
        R(15,1,2,1,'#f00');
        R(10,12,12,2,c1);R(9,14,14,8,c1);
        break;
      case 'guard':
        R(11,0,10,4,'#888');R(12,-1,8,2,'#888');
        R(12,3,8,2,'#666');
        R(13,4,2,1,'#000');R(17,4,2,1,'#000');
        R(11,12,10,6,c1);R(9,13,14,4,c1);
        break;
      case 'sage':
        R(13,10,6,6,hair);R(14,15,4,4,hair);
        R(11,14,10,10,c1);
        R(22,2,2,14,'#5c3a1e');
        break;
      case 'priestess':
        R(11,0,10,4,hair);R(10,3,12,6,hair);R(11,8,10,4,hair);
        R(12,2,8,1,'#ffd700');
        R(11,14,10,10,c1);R(10,22,12,6,c1);
        R(15,16,2,4,'#ffd700');R(14,17,4,2,'#ffd700');
        break;
      case 'tavern':
        R(12,14,8,8,c2);
        R(12,10,8,1,hair);R(11,11,10,1,hair);
        break;
      default:
        R(12,12,8,10,c1);
    }

    // Body
    R(12,12,8,6,c2);
    R(12,17,8,1,'#8b4513');
    R(9,12,3,4,skin);R(20,12,3,4,skin);
    // Legs
    R(13,18,3,8,c2);R(16,18,3,8,c2);
    // Shoes
    R(13,25,3,2,'#5c3a1e');R(16,25,3,2,'#5c3a1e');

    return canvas;
  },

  generateItemIcon: function(itemId) {
    const size = 24;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

    let t = 'generic';
    if (/sword|blade|kris|rapier|saber/i.test(itemId)) t='sword';
    else if (/bow|crossbow|arbalest|longbow/i.test(itemId)) t='bow';
    else if (/staff|stick|rod|wand/i.test(itemId)) t='staff';
    else if (/helm|helmet|hat|hood|crown/i.test(itemId)) t='helmet';
    else if (/armor|plate|robe|mail|coat/i.test(itemId)) t='armor';
    else if (/shield|guard|buckler/i.test(itemId)) t='shield';
    else if (/potion.?hp|hp_potion|heal|health/i.test(itemId)) t='potion_hp';
    else if (/potion.?mp|mp_potion|mana|magic_potion/i.test(itemId)) t='potion_mp';
    else if (/potion.?ap|ap_potion|agility|agi_potion/i.test(itemId)) t='potion_ap';
    else if (/jewel|gem|ring|pendant|amulet|orb/i.test(itemId)) t='jewel';
    else if (/scroll|book|tome|page/i.test(itemId)) t='scroll';
    else if (/arrow|bolt|quiver/i.test(itemId)) t='ammo';
    else if (/wing|wings|cloak|cape|mantle/i.test(itemId)) t='wing';
    else if (/boot|shoe|greave|sabatons/i.test(itemId)) t='boot';
    else if (/glove|gauntlet|bracer/i.test(itemId)) t='glove';
    else if (/pants|leg|pantaloon/i.test(itemId)) t='pants';
    else if (/key|key_.*item/i.test(itemId)) t='key';
    else if (/food|bread|meat|apple/i.test(itemId)) t='food';
    else if (/coin|gold|money/i.test(itemId)) t='coin';

    switch (t) {
      case 'sword':
        R(10,2,4,14,'#c0c0c0');R(9,3,6,12,'#c0c0c0');R(11,1,2,2,'#c0c0c0');
        R(8,14,8,2,'#8b4513');R(10,16,4,5,'#5c3a1e');R(11,20,2,2,'#ffd700');
        R(11,4,1,6,'#fff');
        break;
      case 'bow':
        R(6,2,2,18,'#5c3a1e');R(4,4,4,2,'#5c3a1e');R(4,16,4,2,'#5c3a1e');R(5,3,2,16,'#5c3a1e');
        R(10,4,1,16,'#ddd');R(11,6,8,2,'#8b6914');R(17,5,2,4,'#8b6914');
        R(18,5,3,1,'#c0c0c0');R(18,8,3,1,'#c0c0c0');R(19,6,3,2,'#c0c0c0');
        R(3,10,4,4,'#8b4513');
        break;
      case 'staff':
        R(10,2,2,18,'#5c3a1e');
        R(8,2,6,4,'#4488ff');R(9,1,4,2,'#4488ff');R(10,0,2,2,'#4488ff');
        R(10,2,2,2,'#88bbff');R(7,5,2,2,'#4488ff');R(13,5,2,2,'#4488ff');
        R(9,18,4,3,'#4a2a1a');
        break;
      case 'helmet':
        R(7,4,10,8,'#888');R(8,3,8,2,'#888');R(9,2,6,2,'#888');
        R(8,7,8,2,'#666');R(9,7,6,1,'#000');
        R(10,1,4,2,'#f00');R(11,0,2,1,'#f00');
        R(8,10,10,1,'#aaa');R(9,11,8,1,'#aaa');
        break;
      case 'armor':
        R(6,4,12,14,'#888');R(7,3,10,2,'#888');
        R(8,4,8,2,'#666');R(4,5,3,4,'#999');R(17,5,3,4,'#999');
        R(7,14,10,2,'#8b4513');R(10,14,4,2,'#ffd700');
        R(11,7,2,7,'#aaa');
        break;
      case 'shield':
        R(6,2,12,16,'#4a0000');R(7,1,10,18,'#4a0000');R(8,0,8,20,'#4a0000');
        R(7,2,10,1,'#ffd700');R(7,17,10,1,'#ffd700');R(6,3,1,14,'#ffd700');R(17,3,1,14,'#ffd700');
        R(10,5,4,10,'#ffcc00');R(8,8,8,4,'#ffcc00');
        break;
      case 'potion_hp':
        R(9,6,6,12,'#c00');R(10,4,4,4,'#c00');R(11,3,2,2,'#c00');
        R(10,6,4,2,'#800');R(11,8,2,4,'#f44');
        R(10,2,4,2,'#8b4513');R(11,1,2,1,'#8b4513');
        R(10,10,4,6,'#f00');
        break;
      case 'potion_mp':
        R(9,6,6,12,'#04c');R(10,4,4,4,'#04c');R(11,3,2,2,'#04c');
        R(10,6,4,2,'#028');R(11,8,2,4,'#48f');
        R(10,2,4,2,'#8b4513');R(11,1,2,1,'#8b4513');
        R(10,10,4,6,'#04f');
        break;
      case 'potion_ap':
        R(9,6,6,12,'#0a4');R(10,4,4,4,'#0a4');R(11,3,2,2,'#0a4');
        R(10,6,4,2,'#062');R(11,8,2,4,'#4f8');
        R(10,2,4,2,'#8b4513');R(11,1,2,1,'#8b4513');
        R(10,10,4,6,'#0f6');
        break;
      case 'jewel':
        R(8,6,8,8,'#48f');R(9,5,6,10,'#48f');R(10,4,4,12,'#48f');
        R(10,6,4,4,'#8bf');R(11,7,2,2,'#fff');
        R(7,12,10,2,'#ffd700');R(8,14,8,2,'#ffd700');
        break;
      case 'scroll':
        R(7,4,10,14,'#d4c8a0');R(8,3,8,16,'#d4c8a0');R(8,4,8,14,'#c8b890');
        R(10,8,4,2,'#8b6914');R(10,12,4,1,'#8b6914');
        R(7,2,10,2,'#8b4513');R(7,17,10,2,'#8b4513');
        break;
      case 'ammo':
        R(6,2,2,12,'#c0c0c0');R(8,3,2,10,'#c0c0c0');R(10,4,2,8,'#c0c0c0');R(12,5,2,6,'#c0c0c0');R(14,6,2,4,'#c0c0c0');
        R(7,14,10,2,'#8b6914');R(6,15,12,3,'#8b6914');
        R(5,1,4,2,'#f00');
        break;
      case 'wing':
        R(6,6,12,8,'#fff');R(5,4,14,10,'#fff');R(4,6,16,6,'#fff');
        R(7,5,10,8,'#e0e0e0');R(10,8,4,4,'#ffd700');R(11,7,2,6,'#ffd700');
        break;
      case 'boot':
        R(7,6,10,10,'#5c3a1e');R(6,8,12,8,'#5c3a1e');R(5,10,14,6,'#5c3a1e');
        R(7,10,10,3,'#4a2a1a');R(6,12,12,1,'#8b6914');R(6,6,4,2,'#888');
        break;
      case 'glove':
        R(7,10,10,8,'#8b4513');R(8,8,8,10,'#8b4513');R(6,12,12,6,'#8b4513');
        R(8,12,8,4,'#6a3010');R(8,8,3,3,'#888');R(13,8,3,3,'#888');
        break;
      case 'pants':
        R(7,4,10,14,'#4a4a6a');R(6,6,12,12,'#4a4a6a');
        R(8,6,8,10,'#3a3a5a');R(7,14,10,2,'#8b4513');
        break;
      case 'key':
        R(10,2,4,14,'#ffd700');R(10,16,4,4,'#ffd700');R(9,15,6,2,'#ffd700');
        R(11,10,2,4,'#ffd700');R(9,4,6,2,'#ffd700');
        break;
      case 'food':
        R(8,8,8,8,'#d4a060');R(9,6,6,10,'#d4a060');
        R(9,8,6,6,'#c08840');R(11,4,2,3,'#8b4513');
        R(8,10,8,2,'#f44');
        break;
      case 'coin':
        R(7,6,10,10,'#ffd700');R(8,5,8,12,'#ffd700');R(9,4,6,14,'#ffd700');
        R(9,7,6,8,'#daa520');R(10,8,2,4,'#ffec80');R(11,9,2,2,'#ffec80');
        break;
      default:
        R(8,6,8,10,'#888');R(9,5,6,12,'#888');R(10,4,4,14,'#888');
        R(9,7,6,6,'#aaa');R(10,12,4,2,'#666');
        ctx.font='8px monospace';ctx.fillStyle='#fff';ctx.fillText('?',10,12);
    }
    return canvas;
  },

  generateSkillIcon: function(skillId) {
    const size = 24;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

    // Background circle
    R(2,2,20,20,'#1a1a2a');R(4,4,16,16,'#2a2a3a');R(5,5,14,14,'#3a3a4a');

    if (/flame|fire|burn|inferno|fire.?ball|fire.?blast|fire.?storm|explosion/i.test(skillId)) {
      R(8,10,8,4,'#f40');R(10,8,4,8,'#f40');R(6,11,12,2,'#f40');R(11,6,2,12,'#f40');
      R(9,11,6,2,'#fa0');R(11,9,2,6,'#fa0');
      R(10,11,4,2,'#ff0');R(11,10,2,4,'#ff0');
    } else if (/ice|frost|freeze|cold|ice.?storm|blizzard|snow/i.test(skillId)) {
      R(8,4,2,16,'#48f');R(14,4,2,16,'#48f');R(4,8,16,2,'#48f');R(4,14,16,2,'#48f');
      R(6,6,2,12,'#8bf');R(10,10,4,4,'#8bf');R(16,6,2,12,'#8bf');
      R(7,7,10,10,'#fff');
    } else if (/lightning|thunder|electri|shock|bolt|zeus/i.test(skillId)) {
      R(10,2,4,12,'#ff0');R(8,8,8,2,'#ff0');R(6,10,12,2,'#ff0');R(10,12,4,10,'#ff0');
      R(11,3,2,8,'#fff');R(9,8,6,1,'#fff');R(9,11,6,1,'#fff');R(11,14,2,6,'#fff');
      R(9,6,2,2,'#48f');R(17,6,2,2,'#48f');R(13,4,2,2,'#48f');
    } else if (/poison|venom|acid|toxin|decay/i.test(skillId)) {
      R(7,7,10,10,'#0a0');R(8,8,8,8,'#0f0');R(9,9,6,6,'#0c0');
      R(5,12,4,2,'#0a0');R(15,12,4,2,'#0a0');R(12,5,2,4,'#0a0');
    } else if (/heal|recover|cure|bless|holy|regen/i.test(skillId)) {
      R(8,4,2,6,'#fff');R(14,4,2,6,'#fff');R(6,6,2,4,'#fff');R(16,6,2,4,'#fff');
      R(10,8,4,10,'#ffd700');R(11,6,2,12,'#ffd700');R(8,10,8,2,'#ffd700');
      R(6,12,12,2,'#ffd700');R(7,7,2,6,'#fff');R(15,7,2,6,'#fff');
    } else if (/shield|defense|protect|barrier|guard|wall/i.test(skillId)) {
      R(6,4,12,16,'#48f');R(7,3,10,18,'#48f');R(8,2,8,20,'#48f');
      R(7,4,10,1,'#fff');R(7,18,10,1,'#fff');R(6,5,1,13,'#fff');R(17,5,1,13,'#fff');
    } else if (/star|meteor|comet|shooting.?star/i.test(skillId)) {
      R(10,4,4,16,'#ff0');R(4,10,16,4,'#ff0');R(6,6,12,12,'#ff0');
      R(8,8,8,8,'#fa0');R(10,10,4,4,'#fff');
      R(2,12,2,2,'#ff0');R(20,12,2,2,'#ff0');R(12,2,2,2,'#ff0');
    } else if (/cross|crucifix|divine/i.test(skillId)) {
      R(10,2,4,20,'#ffd700');R(4,10,16,4,'#ffd700');
      R(11,3,2,18,'#fff');R(5,10,14,2,'#fff');
    } else if (/arrow|shoot|shot|projectile|missile|bolt/i.test(skillId)) {
      R(4,10,16,4,'#8b6914');R(8,8,8,8,'#8b6914');
      R(6,4,4,4,'#c0c0c0');R(6,16,4,4,'#c0c0c0');
      R(10,10,4,4,'#ff0');
    } else if (/earth|quake|rock|stone|tremor|crush|smash/i.test(skillId)) {
      R(6,8,12,10,'#8a6a3a');R(7,6,10,12,'#8a6a3a');R(8,5,8,14,'#8a6a3a');
      R(7,8,10,8,'#6a4a2a');R(4,12,16,2,'#8a6a3a');R(10,4,4,4,'#8a6a3a');
    } else if (/wind|gust|cyclone|tornado|whirl|air/i.test(skillId)) {
      R(6,6,4,16,'#c0e8f0');R(14,6,4,16,'#c0e8f0');
      R(10,4,4,20,'#e0f8ff');
      R(4,10,4,6,'#e0f8ff');R(16,10,4,6,'#e0f8ff');
      R(8,12,8,4,'#fff');
    } else if (/dark|shadow|curse|hex|doom|necrosis|death/i.test(skillId)) {
      R(6,6,12,12,'#2a1a4a');R(7,7,10,10,'#1a0a2a');
      R(8,10,8,4,'#6a4a8a');R(10,8,4,8,'#6a4a8a');
      R(5,11,14,2,'#6a4a8a');R(11,5,2,14,'#6a4a8a');
      R(9,11,6,2,'#a080c0');R(11,9,2,6,'#a080c0');
    } else if (/teleport|blink|warp|portal|gate|move|dash/i.test(skillId)) {
      R(8,4,8,16,'#a0c0f0');R(4,8,16,8,'#a0c0f0');
      R(6,6,12,12,'#c0e0ff');R(8,8,8,8,'#e0f0ff');
      R(10,10,4,4,'#fff');
    } else {
      R(8,6,8,8,'#ffd700');R(9,5,6,10,'#ffd700');R(10,4,4,12,'#ffd700');
      R(7,8,10,2,'#ffd700');R(11,7,2,8,'#ffd700');
    }
    return canvas;
  },

  generateUIElement: function(element) {
    const size = 32;
    const canvas = this.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

    if (/button|btn_?(red|green|blue|gold)|ok|cancel/i.test(element)) {
      let c1, c2, c3;
      if (/red|cancel|close/i.test(element)) { c1='#8b0000';c2='#cc0000';c3='#aa0000'; }
      else if (/green/i.test(element)) { c1='#006600';c2='#009900';c3='#008800'; }
      else if (/blue|ok|confirm/i.test(element)) { c1='#003388';c2='#0055cc';c3='#0044aa'; }
      else if (/gold/i.test(element)) { c1='#8b6914';c2='#cc9900';c3='#aa8800'; }
      else { c1='#444';c2='#666';c3='#555'; }
      R(0,0,32,32,c3);R(2,2,28,28,c2);R(4,4,24,24,c1);
      R(4,4,24,2,c2);R(4,4,2,24,c2);
      R(6,6,20,20,c1);
    } else if (/bar|health|hp/.test(element)) {
      R(0,0,32,8,'#222');R(0,0,2,8,'#444');R(30,0,2,8,'#444');
      R(0,6,32,2,'#111');R(2,2,28,4,'#800');R(2,2,20,4,'#f00');
    } else if (/bar_?mp|mana/.test(element)) {
      R(0,0,32,8,'#222');R(0,0,2,8,'#444');R(30,0,2,8,'#444');
      R(0,6,32,2,'#111');R(2,2,28,4,'#038');R(2,2,22,4,'#06f');
    } else if (/bar_?ap|stamina|exp|xp/.test(element)) {
      R(0,0,32,8,'#222');R(0,0,2,8,'#444');R(30,0,2,8,'#444');
      R(0,6,32,2,'#111');R(2,2,28,4,'#060');R(2,2,18,4,'#0c0');
    } else if (/panel|window|bg|background|inventory|dialog/.test(element)) {
      R(0,0,32,32,'#1a1a2a');R(1,1,30,30,'#2a2a3a');R(2,2,28,28,'#22223a');
      R(2,2,28,1,'#4a4a5a');R(2,2,1,28,'#4a4a5a');
      R(2,29,28,1,'#0a0a1a');R(29,2,1,28,'#0a0a1a');
    } else if (/slot|cell|grid|empty/i.test(element)) {
      R(0,0,32,32,'#1a1a2a');R(2,2,28,28,'#2a2a3a');R(3,3,26,26,'#22223a');
      R(2,2,28,1,'#3a3a4a');R(2,2,1,28,'#3a3a4a');
    } else if (/arrow_?up|up_?arrow/i.test(element)) {
      R(8,4,16,4,'#ccc');R(10,8,12,4,'#ccc');R(12,12,8,4,'#ccc');R(14,16,4,12,'#ccc');
    } else if (/arrow_?down|down_?arrow/i.test(element)) {
      R(14,4,4,12,'#ccc');R(12,16,8,4,'#ccc');R(10,20,12,4,'#ccc');R(8,24,16,4,'#ccc');
    } else if (/arrow_?left|left_?arrow/i.test(element)) {
      R(4,8,4,16,'#ccc');R(8,10,4,12,'#ccc');R(12,12,4,8,'#ccc');R(16,14,12,4,'#ccc');
    } else if (/arrow_?right|right_?arrow/i.test(element)) {
      R(4,14,12,4,'#ccc');R(16,12,4,8,'#ccc');R(20,10,4,12,'#ccc');R(24,8,4,16,'#ccc');
    } else if (/close|exit|x/i.test(element)) {
      R(4,4,4,24,'#cc0000');R(8,8,4,20,'#cc0000');R(12,12,4,16,'#cc0000');
      R(16,12,4,16,'#cc0000');R(20,8,4,20,'#cc0000');R(24,4,4,24,'#cc0000');
    } else if (/border|frame|edge/i.test(element)) {
      R(0,0,32,32,'#2a2a3a');R(2,2,28,28,'#1a1a2a');
      R(0,0,32,2,'#4a4a5a');R(0,0,2,32,'#4a4a5a');
      R(0,30,32,2,'#0a0a1a');R(30,0,2,32,'#0a0a1a');
    } else {
      R(0,0,32,32,'#ff00ff');R(2,2,28,28,'#000');
      ctx.font='10px monospace';ctx.fillStyle='#fff';ctx.fillText('UI',10,18);
    }
    return canvas;
  }
};
