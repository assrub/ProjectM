const Renderer = {
  canvas: null,
  ctx: null,
  camera: { x: 0, y: 0 },
  tileSize: 32,
  width: 0,
  height: 0,
  damagePopups: [],
  displayWidth: 0,
  displayHeight: 0,

  init: function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = canvasId;
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    var self = this;
    window.addEventListener("resize", function() { self.resize(); });
    window.addEventListener("orientationchange", function() { setTimeout(function() { self.resize(); }, 200); });
  },

  resize: function() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.displayWidth = this.width;
    this.displayHeight = this.height;
  },

  clear: function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  },

  setCamera: function(x, y) {
    this.camera.x = x - this.width / 2;
    this.camera.y = y - this.height / 2;
  },

  render: function(gameState) {
    if (!gameState) return;
    this.clear();
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (gameState.map) {
      this.renderTiles(gameState.map);
    }
    this.renderNPCs(gameState.npcs);
    this.renderDrops(gameState.drops);
    this.renderMonsters(gameState.monsters);
    this.renderPlayers(gameState.players);
    this.renderProjectiles(gameState.projectiles);
    this.renderDamagePopups();
  },

  renderTiles: function(map) {
    if (!map || !map.tileData) return;
    var startCol = Math.max(0, Math.floor(this.camera.x / this.tileSize));
    var startRow = Math.max(0, Math.floor(this.camera.y / this.tileSize));
    var endCol = Math.min(map.width, Math.ceil((this.camera.x + this.width) / this.tileSize) + 1);
    var endRow = Math.min(map.height, Math.ceil((this.camera.y + this.height) / this.tileSize) + 1);

    for (var row = startRow; row < endRow; row++) {
      for (var col = startCol; col < endCol; col++) {
        var tileType = map.tileData[row] && map.tileData[row][col] !== undefined ? map.tileData[row][col] : 0;
        var screenPos = this.worldToScreen(col, row);
        var tileSpriteKey = tileType === 0 ? "tile_grass" : "tile_wall";
        var tileKey = map.id + "_" + tileType;
        var sprite = Sprites.get(tileType === 0 ? "tile_grass" : "tile_wall");
        if (sprite) {
          this.ctx.drawImage(sprite, Math.round(screenPos.x), Math.round(screenPos.y));
        } else {
          this.ctx.fillStyle = tileType === 0 ? "#3a7a2a" : "#6a6a6a";
          this.ctx.fillRect(Math.round(screenPos.x), Math.round(screenPos.y), this.tileSize, this.tileSize);
        }
      }
    }
  },

  renderMonsters: function(monsters) {
    if (!monsters) return;
    var sorted = [];
    var keys = Object.keys(monsters);
    for (var i = 0; i < keys.length; i++) {
      var m = monsters[keys[i]];
      if (m && m.isAlive) sorted.push(m);
    }
    sorted.sort(function(a, b) { return a.y - b.y || a.x - b.x; });

    for (var j = 0; j < sorted.length; j++) {
      var mon = sorted[j];
      var sp = this.worldToScreen(mon.x, mon.y);
      var spriteKey = "monster_" + mon.defId;
      var sprite = Sprites.get(spriteKey);
      if (sprite) {
        var sx = Math.round(sp.x - sprite.width / 2 + this.tileSize / 2);
        var sy = Math.round(sp.y - sprite.height + this.tileSize);
        this.ctx.drawImage(sprite, sx, sy);
      } else {
        this.ctx.fillStyle = "#ff0000";
        this.ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 24, 24);
      }

      if (mon.hp < mon.maxHp) {
        var barW = 30;
        var barH = 4;
        var barX = Math.round(sp.x + this.tileSize / 2 - barW / 2);
        var barY = Math.round(sp.y + 4);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(barX, barY, barW, barH);
        var fillW = Math.round((mon.hp / mon.maxHp) * (barW - 2));
        this.ctx.fillStyle = "#f00";
        this.ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);
      }

      var nameStr = mon.def ? mon.def.name : mon.defId;
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "9px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(nameStr, Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + this.tileSize + 4));
    }
  },

  renderPlayers: function(players) {
    if (!players) return;
    var sorted = [];
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      var p = players[keys[i]];
      if (p && p.isAlive) sorted.push(p);
    }
    sorted.sort(function(a, b) { return a.y - b.y || a.x - b.x; });

    for (var j = 0; j < sorted.length; j++) {
      var p = sorted[j];
      var sp = this.worldToScreen(p.x, p.y);

      var dirKey = p.direction || "down";
      var spriteKey = "player_" + (p.className === "dark_knight" ? "DarkKnight" : p.className === "elf" ? "Elf" : "Mago") + "_" + dirKey;
      var sprite = Sprites.get(spriteKey);
      if (sprite) {
        var sx = Math.round(sp.x - sprite.width / 2 + this.tileSize / 2);
        var sy = Math.round(sp.y - sprite.height + this.tileSize);
        this.ctx.drawImage(sprite, sx, sy);
      } else {
        this.ctx.fillStyle = p.isLocal ? "#00ff00" : "#0088ff";
        this.ctx.fillRect(Math.round(sp.x + 4), Math.round(sp.y + 2), 24, 28);
      }

      this.ctx.fillStyle = p.isLocal ? "#ffd700" : "#fff";
      this.ctx.font = "bold 10px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(p.name, Math.round(sp.x + this.tileSize / 2), Math.round(sp.y));

      if (p.hp < p.maxHp || p.isLocal) {
        var barW = 32;
        var barH = 4;
        var barX = Math.round(sp.x + this.tileSize / 2 - barW / 2);
        var barY = Math.round(sp.y + 10);
        this.ctx.fillStyle = "rgba(0,0,0,0.6)";
        this.ctx.fillRect(barX, barY, barW, barH);
        var fillW = Math.round((p.hp / p.maxHp) * (barW - 2));
        this.ctx.fillStyle = "#e53935";
        this.ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);
      }
    }
  },

  renderNPCs: function(npcs) {
    if (!npcs) return;
    var sorted = [];
    var keys = Object.keys(npcs);
    for (var i = 0; i < keys.length; i++) {
      if (npcs[keys[i]]) sorted.push(npcs[keys[i]]);
    }
    sorted.sort(function(a, b) { return a.y - b.y || a.x - b.x; });

    for (var j = 0; j < sorted.length; j++) {
      var npc = sorted[j];
      var sp = this.worldToScreen(npc.x, npc.y);
      var spriteKey = "npc_" + npc.id;
      var sprite = Sprites.get(spriteKey);
      if (sprite) {
        var sx = Math.round(sp.x - sprite.width / 2 + this.tileSize / 2);
        var sy = Math.round(sp.y - sprite.height + this.tileSize);
        this.ctx.drawImage(sprite, sx, sy);
      } else {
        this.ctx.fillStyle = "#ffff00";
        this.ctx.fillRect(Math.round(sp.x + 6), Math.round(sp.y), 20, 32);
      }

      this.ctx.fillStyle = "#ffd700";
      this.ctx.font = "9px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(npc.name || npc.id, Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + this.tileSize + 4));
    }
  },

  renderProjectiles: function(projectiles) {
    if (!projectiles || !projectiles.length) return;
    for (var i = 0; i < projectiles.length; i++) {
      var proj = projectiles[i];
      if (!proj || !proj.alive) continue;
      var sp = this.worldToScreen(proj.x, proj.y);
      var colors = {
        fire_ball: "#ff4400",
        power_wave: "#ffaa00",
        lightning: "#ffff00",
        ice: "#4488ff",
        meteorite: "#ff6600",
        flame: "#ff2200",
        twister: "#88ff88",
        hellfire: "#ff0000",
        arrow: "#c0c0c0",
        penetration: "#ffd700",
        ice_arrow: "#88bbff",
        aqua_beam: "#4488ff",
        cometfall: "#ff8844",
        inferno: "#ff4400",
        evil_spirit: "#8800ff",
        nova: "#ffffff"
      };
      var color = colors[proj.type] || "#ff00ff";
      var size = proj.isAoE ? 8 : 5;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + this.tileSize / 2), size, 0, Math.PI * 2);
      this.ctx.fill();

      if (proj.isAoE) {
        this.ctx.strokeStyle = "rgba(255,255,255,0.3)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + this.tileSize / 2), size * 2, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  },

  renderDamagePopups: function() {
    for (var i = this.damagePopups.length - 1; i >= 0; i--) {
      var popup = this.damagePopups[i];
      popup.life -= 0.016;
      popup.y -= 0.8;
      var alpha = Math.max(0, popup.life / popup.maxLife);
      this.ctx.globalAlpha = alpha;
      this.ctx.font = popup.isCrit ? "bold 20px monospace" : "bold 14px monospace";
      this.ctx.textAlign = "center";
      var sp = this.worldToScreen(popup.worldX, popup.worldY);
      this.ctx.fillStyle = popup.isCrit ? "#ffd700" : popup.isHeal ? "#4caf50" : "#ffffff";
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(popup.text, Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + popup.y));
      this.ctx.fillText(popup.text, Math.round(sp.x + this.tileSize / 2), Math.round(sp.y + popup.y));
      this.ctx.globalAlpha = 1;

      if (popup.life <= 0) {
        this.damagePopups.splice(i, 1);
      }
    }
  },

  renderDrops: function(drops) {
    if (!drops || !drops.length) return;
    for (var i = 0; i < drops.length; i++) {
      var drop = drops[i];
      if (!drop) continue;
      var sp = this.worldToScreen(drop.x, drop.y);
      var itemSprite = Sprites.get("item_" + drop.itemDefId);
      if (itemSprite) {
        var sx = Math.round(sp.x + this.tileSize / 2 - itemSprite.width / 2);
        var sy = Math.round(sp.y + this.tileSize / 2 - itemSprite.height / 2);
        this.ctx.drawImage(itemSprite, sx, sy);
      } else {
        this.ctx.fillStyle = "#ffd700";
        this.ctx.fillRect(Math.round(sp.x + 8), Math.round(sp.y + 8), 16, 16);
        this.ctx.fillStyle = "#000";
        this.ctx.font = "10px monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("?", Math.round(sp.x + 16), Math.round(sp.y + 20));
      }
    }
  },

  renderMinimap: function(minimapCanvas, gameState) {
    if (!minimapCanvas || !gameState || !gameState.map) return;
    var ctx = minimapCanvas.getContext("2d");
    var map = gameState.map;
    var mw = minimapCanvas.width;
    var mh = minimapCanvas.height;
    var scaleX = mw / map.width;
    var scaleY = mh / map.height;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, mw, mh);

    for (var y = 0; y < map.height; y++) {
      for (var x = 0; x < map.width; x++) {
        var tile = map.tileData[y] ? map.tileData[y][x] : 0;
        if (tile !== 0) {
          ctx.fillStyle = "#444";
          ctx.fillRect(Math.floor(x * scaleX), Math.floor(y * scaleY), Math.ceil(scaleX), Math.ceil(scaleY));
        } else {
          ctx.fillStyle = "#1a3a1a";
          ctx.fillRect(Math.floor(x * scaleX), Math.floor(y * scaleY), Math.ceil(scaleX), Math.ceil(scaleY));
        }
      }
    }

    if (gameState.players) {
      var pkeys = Object.keys(gameState.players);
      for (var pi = 0; pi < pkeys.length; pi++) {
        var p = gameState.players[pkeys[pi]];
        if (!p) continue;
        ctx.fillStyle = p.isLocal ? "#ffd700" : "#88ff88";
        ctx.fillRect(Math.floor(p.x * scaleX - 1), Math.floor(p.y * scaleY - 1), 3, 3);
      }
    }

    if (gameState.monsters) {
      var mkeys = Object.keys(gameState.monsters);
      for (var mi = 0; mi < mkeys.length; mi++) {
        var m = gameState.monsters[mkeys[mi]];
        if (!m || !m.isAlive) continue;
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(Math.floor(m.x * scaleX), Math.floor(m.y * scaleY), 2, 2);
      }
    }
  },

  worldToScreen: function(worldX, worldY) {
    return {
      x: worldX * this.tileSize - this.camera.x,
      y: worldY * this.tileSize - this.camera.y
    };
  },

  screenToWorld: function(screenX, screenY) {
    return {
      x: Math.floor((screenX + this.camera.x) / this.tileSize),
      y: Math.floor((screenY + this.camera.y) / this.tileSize)
    };
  },

  addDamagePopup: function(x, y, damage, isCrit) {
    this.damagePopups.push({
      worldX: x,
      worldY: y,
      text: String(Math.round(damage)),
      isCrit: isCrit || false,
      isHeal: false,
      life: 1.2,
      maxLife: 1.2,
      y: 0
    });
  },

  addHealPopup: function(x, y, amount) {
    this.damagePopups.push({
      worldX: x,
      worldY: y,
      text: "+" + Math.round(amount),
      isCrit: false,
      isHeal: true,
      life: 1.2,
      maxLife: 1.2,
      y: 0
    });
  }
};
