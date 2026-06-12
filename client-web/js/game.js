const Game = {
  state: "loading",
  player: null,
  otherPlayers: {},
  monsters: {},
  npcs: {},
  projectiles: [],
  drops: [],
  damagePopups: [],
  currentMap: null,
  currentMapId: "lorencia",
  lastTime: 0,
  accumulator: 0,
  fixedDt: 1 / 50,
  moveSendTimer: 0,
  selectedClass: null,
  isPlaying: false,
  monsterIdCounter: 0,
  playerIdCounter: 0,

  init: function() {
    var ipInput = document.getElementById("serverIp");
    if (ipInput && !ipInput.value) {
      ipInput.value = window.location.hostname || "localhost";
    }
    Renderer.init("gameCanvas");
    Input.init();
    this.setupNetworkHandlers();
    this.setupUIHandlers();
    this.loadingProgress(0.2);
    var self = this;
    setTimeout(function() {
      self.loadingProgress(0.6);
      setTimeout(function() {
        self.loadingProgress(1.0);
        setTimeout(function() {
          self.showMenu();
        }, 300);
      }, 300);
    }, 500);
  },

  loadingProgress: function(percent) {
    var bar = document.getElementById("loadingBar");
    if (bar) bar.style.width = (percent * 100) + "%";
    var text = document.querySelector(".loading-text");
    if (text) {
      if (percent < 0.5) text.textContent = "Cargando recursos...";
      else if (percent < 0.9) text.textContent = "Preparando mundo...";
      else text.textContent = "Listo!";
    }
  },

  showMenu: function() {
    this.state = "menu";
    document.getElementById("loadingScreen").classList.add("hidden");
    document.getElementById("mainMenu").classList.remove("hidden");
  },

  setupUIHandlers: function() {
    var self = this;
    var selectBtns = document.querySelectorAll(".select-btn");
    for (var i = 0; i < selectBtns.length; i++) {
      (function(btn) {
        btn.addEventListener("click", function(e) {
          var classVal = btn.getAttribute("data-class");
          self.selectClass(classVal);
        });
      })(selectBtns[i]);
    }

    var connectBtn = document.getElementById("connectBtn");
    if (connectBtn) {
      connectBtn.addEventListener("click", function() {
        var ipInput = document.getElementById("serverIp");
        var url = ipInput ? ipInput.value.trim() : "localhost";
        if (url && url.indexOf("://") === -1) {
          url = "ws://" + url + ":8899/ws";
        }
        self.connectToServer(url);
      });
    }

    var invCloseBtn = document.getElementById("invCloseBtn");
    if (invCloseBtn) {
      invCloseBtn.addEventListener("click", function() {
        document.getElementById("inventoryPanel").classList.add("hidden");
      });
    }

    var shopCloseBtn = document.getElementById("shopCloseBtn");
    if (shopCloseBtn) {
      shopCloseBtn.addEventListener("click", function() {
        document.getElementById("shopPanel").classList.add("hidden");
      });
    }

    var charCloseBtn = document.getElementById("charCloseBtn");
    if (charCloseBtn) {
      charCloseBtn.addEventListener("click", function() {
        document.getElementById("characterPanel").classList.add("hidden");
      });
    }

    var npcInteract = document.getElementById("npcInteract");
    if (npcInteract) {
      npcInteract.addEventListener("click", function() {
        self.handleNpcInteraction();
      });
    }
  },

  setupNetworkHandlers: function() {
    var self = this;

    Network.registerHandler("WORLD_STATE", function(data) { self.onWorldState(data); });
    Network.registerHandler("PLAYER_JOINED", function(data) { self.onPlayerJoined(data); });
    Network.registerHandler("PLAYER_LEFT", function(data) { self.onPlayerLeft(data); });
    Network.registerHandler("PLAYER_MOVED", function(data) { self.onPlayerMoved(data); });
    Network.registerHandler("DAMAGE_DEALT", function(data) { self.onDamageDealt(data); });
    Network.registerHandler("ITEM_DROPPED", function(data) { self.onItemDropped(data); });
    Network.registerHandler("LEVEL_UP", function(data) { self.onLevelUp(data); });
    Network.registerHandler("CHAT_MESSAGE", function(data) { self.onChatMessage(data); });
    Network.registerHandler("MAP_LOADED", function(data) { self.onMapLoaded(data); });
    Network.registerHandler("INVENTORY_UPDATE", function(data) { self.onInventoryUpdate(data); });
    Network.registerHandler("EQUIPMENT_UPDATE", function(data) { self.onEquipmentUpdate(data); });
    Network.registerHandler("SHOP_INVENTORY", function(data) { self.onShopInventory(data); });
    Network.registerHandler("XP_GAINED", function(data) { self.onXpGained(data); });
    Network.registerHandler("STAT_UPDATE", function(data) { self.onStatUpdate(data); });
    Network.registerHandler("MONSTER_MOVED", function(data) { self.onMonsterMoved(data); });
    Network.registerHandler("GAME_MESSAGE", function(data) { self.onGameMessage(data); });
    Network.registerHandler("ERROR", function(data) { self.onError(data); });
  },

  start: function() {
    this.lastTime = performance.now();
    this.state = "playing";
    this.isPlaying = true;
    var self = this;
    function loop(timestamp) {
      self.loop(timestamp);
    }
    requestAnimationFrame(loop);
  },

  loop: function(timestamp) {
    if (!this.isPlaying) return;
    var dt = (timestamp - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = timestamp;
    this.accumulator += dt;

    var maxSteps = 5;
    while (this.accumulator >= this.fixedDt && maxSteps > 0) {
      this.fixedUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
      maxSteps--;
    }
    if (maxSteps <= 0) {
      this.accumulator = 0;
    }

    this.render();
    var self = this;
    requestAnimationFrame(function(ts) { self.loop(ts); });
  },

  fixedUpdate: function(dt) {
    if (this.state !== "playing" || !this.player) return;

    if (!this.player.isAlive) {
      this.player.deathTimer = (this.player.deathTimer || 0) + dt;
      if (this.player.deathTimer < 3) {
        if (!this.player._deathShown) {
          this.player._deathShown = true;
          this.showDeathOverlay();
          this.addChatMessage("Has muerto! Renacerás en 3 segundos...", "system");
        }
      } else {
        var classDef = GameData.getClass(this.player.className);
        if (classDef) {
          this.player.hp = this.player.maxHp;
          this.player.mp = this.player.maxMp;
          this.player.x = classDef.startingX;
          this.player.y = classDef.startingY;
          this.player.targetX = classDef.startingX;
          this.player.targetY = classDef.startingY;
          this.player.isAlive = true;
          this.player.deathTimer = 0;
          this.player._deathShown = false;
          this.hideDeathOverlay();
          this.addChatMessage("Has renacido!", "system");
        }
      }
      return;
    }

    var joyDir = Input.getJoystickDirection();
    var kbDir = Input.getKeyboardDirection();
    var moveX = joyDir.x !== 0 ? joyDir.x : kbDir.x;
    var moveY = joyDir.y !== 0 ? joyDir.y : kbDir.y;

    if (moveX !== 0 || moveY !== 0) {
      var len = Math.sqrt(moveX * moveX + moveY * moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }
      var speed = this.player.moveSpeed * dt * 4;
      var newX = this.player.x + moveX * speed;
      var newY = this.player.y + moveY * speed;

      newX = Math.max(0, Math.min(this.currentMap ? this.currentMap.width - 1 : 80, newX));
      newY = Math.max(0, Math.min(this.currentMap ? this.currentMap.height - 1 : 80, newY));

      if (this.currentMap && this.currentMap.tileData) {
        var tileX = Math.round(newX);
        var tileY = Math.round(newY);
        if (tileX >= 0 && tileX < this.currentMap.width && tileY >= 0 && tileY < this.currentMap.height) {
          var tileVal = this.currentMap.tileData[tileY] ? this.currentMap.tileData[tileY][tileX] : 0;
          if (tileVal === 0) {
            this.player.targetX = newX;
            this.player.targetY = newY;
          }
        }
      } else {
        this.player.targetX = newX;
        this.player.targetY = newY;
      }

      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.player.direction = moveX > 0 ? "right" : "left";
      } else {
        this.player.direction = moveY > 0 ? "down" : "up";
      }

      this.moveSendTimer += dt;
      if (this.moveSendTimer >= 0.1) {
        this.moveSendTimer = 0;
        Network.send("MOVE", { x: Math.round(this.player.x * 10) / 10, y: Math.round(this.player.y * 10) / 10 });
      }
    }

    this.player.update(dt);

    var otherKeys = Object.keys(this.otherPlayers);
    for (var i = 0; i < otherKeys.length; i++) {
      var other = this.otherPlayers[otherKeys[i]];
      if (other) other.update(dt);
    }

    var monsterKeys = Object.keys(this.monsters);
    for (var j = 0; j < monsterKeys.length; j++) {
      var mon = this.monsters[monsterKeys[j]];
      if (mon) {
        var allPlayers = {};
        if (this.player) allPlayers[this.player.id || "local"] = this.player;
        var opKeys = Object.keys(this.otherPlayers);
        for (var k = 0; k < opKeys.length; k++) {
          allPlayers[opKeys[k]] = this.otherPlayers[opKeys[k]];
        }
        var atkResult = mon.update(dt, allPlayers);
        if (atkResult && atkResult.damage > 0 && this.player) {
          this.player.takeDamage(atkResult.damage);
          Renderer.addDamagePopup(this.player.x, this.player.y - 0.5, atkResult.damage, false);
        }
      }
    }

    for (var p = this.projectiles.length - 1; p >= 0; p--) {
      this.projectiles[p].update(dt);
      if (!this.projectiles[p].alive) {
        this.projectiles.splice(p, 1);
      }
    }

    for (var d = this.drops.length - 1; d >= 0; d--) {
      this.drops[d].destroyTimer -= dt;
      if (this.drops[d].destroyTimer <= 0) {
        this.drops.splice(d, 1);
      }
    }

    this.checkItemPickups();
    this.checkNpcProximity();
    this.updateHUD();
  },

  render: function() {
    if (this.state !== "playing" || !this.player) return;

    Renderer.setCamera(
      this.player.x * Renderer.tileSize + Renderer.tileSize / 2,
      this.player.y * Renderer.tileSize + Renderer.tileSize / 2
    );

    Renderer.render({
      map: this.currentMap,
      players: this.getAllPlayers(),
      monsters: this.monsters,
      npcs: this.npcs,
      projectiles: this.projectiles,
      drops: this.drops
    });

    var minimapCanvas = document.getElementById("minimapCanvas");
    if (minimapCanvas) {
      Renderer.renderMinimap(minimapCanvas, {
        map: this.currentMap,
        players: this.getAllPlayers(),
        monsters: this.monsters
      });
    }
  },

  getAllPlayers: function() {
    var result = {};
    if (this.player) {
      result[this.player.id || "local"] = this.player;
    }
    var keys = Object.keys(this.otherPlayers);
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = this.otherPlayers[keys[i]];
    }
    return result;
  },

  updateHUD: function() {
    if (!this.player) return;

    var pName = document.getElementById("playerName");
    if (pName) pName.textContent = this.player.name;

    var pLevel = document.getElementById("playerLevel");
    if (pLevel) pLevel.textContent = "Nv. " + this.player.level;

    var goldAmt = document.getElementById("goldAmount");
    if (goldAmt) goldAmt.textContent = this.player.gold || 0;

    var hpFill = document.getElementById("hpFill");
    if (hpFill) {
      var hpPct = (this.player.hp / this.player.maxHp) * 100;
      hpFill.style.width = Math.max(0, Math.min(100, hpPct)) + "%";
    }

    var hpText = document.getElementById("hpText");
    if (hpText) hpText.textContent = "HP: " + Math.round(this.player.hp) + "/" + Math.round(this.player.maxHp);

    var mpFill = document.getElementById("mpFill");
    if (mpFill) {
      var mpPct = (this.player.mp / this.player.maxMp) * 100;
      mpFill.style.width = Math.max(0, Math.min(100, mpPct)) + "%";
    }

    var mpText = document.getElementById("mpText");
    if (mpText) mpText.textContent = "MP: " + Math.round(this.player.mp) + "/" + Math.round(this.player.maxMp);

    var xpFill = document.getElementById("xpFill");
    if (xpFill) {
      var needed = Player.getXpForLevel(this.player.level);
      var xpPct = (this.player.xp / needed) * 100;
      xpFill.style.width = Math.max(0, Math.min(100, xpPct)) + "%";
    }

    var xpText = document.getElementById("xpText");
    if (xpText) {
      var needed = Player.getXpForLevel(this.player.level);
      xpText.textContent = "XP: " + Math.round(this.player.xp) + "/" + needed;
    }

    var hpCount = document.getElementById("hpPotionCount");
    if (hpCount) {
      var count = 0;
      for (var i = 0; i < (this.player.inventory || []).length; i++) {
        var item = this.player.inventory[i];
        if (item && item.type === "potion" && item.hpRestore > 0) count++;
      }
      hpCount.textContent = count;
    }

    var mpCount = document.getElementById("mpPotionCount");
    if (mpCount) {
      var mcount = 0;
      for (var j = 0; j < (this.player.inventory || []).length; j++) {
        var item = this.player.inventory[j];
        if (item && item.type === "potion" && item.mpRestore > 0) mcount++;
      }
      mpCount.textContent = mcount;
    }

    this.updateSkillBar();
  },

  updateSkillBar: function() {
    var btns = document.querySelectorAll(".skill-btn");
    if (!btns || !this.player) return;
    for (var i = 0; i < btns.length; i++) {
      var skillId = this.player.skillBar[i];
      if (skillId) {
        var skill = GameData.getSkill(skillId);
        btns[i].classList.add("has-skill");
        btns[i].style.backgroundImage = "";
        btns[i].style.backgroundColor = "rgba(0,0,0,0.5)";
        if (skill) {
          var icon = Sprites.get("skill_" + skillId);
          if (icon && icon.toDataURL) {
            btns[i].style.backgroundImage = "url(" + icon.toDataURL() + ")";
            btns[i].style.backgroundSize = "cover";
            btns[i].style.backgroundPosition = "center";
          }
        }
      } else {
        btns[i].classList.remove("has-skill");
        btns[i].style.backgroundImage = "";
        btns[i].style.backgroundColor = "rgba(0,0,0,0.5)";
      }
    }
  },

  checkItemPickups: function() {
    if (!this.player || !this.drops.length) return;
    for (var i = this.drops.length - 1; i >= 0; i--) {
      var drop = this.drops[i];
      if (!drop) continue;
      var dx = drop.x - this.player.x;
      var dy = drop.y - this.player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5 && this.player.inventory.length < 16) {
        var itemDef = drop.definition;
        if (itemDef) {
          var itemCopy = {};
          for (var key in itemDef) {
            if (itemDef.hasOwnProperty(key)) {
              itemCopy[key] = itemDef[key];
            }
          }
          itemCopy.instanceId = drop.instanceId;
          this.player.inventory.push(itemCopy);
          this.addChatMessage("Recogiste " + itemDef.name, "system");
          Network.send("PICKUP_ITEM", { instanceId: drop.instanceId, itemDefId: drop.itemDefId });
        }
        this.drops.splice(i, 1);
      }
    }
  },

  connectToServer: function(serverUrl) {
    this.state = "connecting";
    Network.connect(serverUrl);
  },

  checkNpcProximity: function() {
    if (!this.player || !this.player.isAlive) return;
    var nearNpc = null;
    var npcKeys = Object.keys(this.npcs);
    for (var i = 0; i < npcKeys.length; i++) {
      var npc = this.npcs[npcKeys[i]];
      if (npc && npc.isPlayerInRange(this.player)) {
        nearNpc = npc;
        break;
      }
    }
    var btn = document.getElementById("npcInteract");
    if (btn) {
      if (nearNpc) {
        btn.classList.remove("hidden");
        var txt = document.getElementById("npcInteractText");
        if (txt) txt.textContent = nearNpc.name + " - Presiona para hablar";
      } else {
        btn.classList.add("hidden");
      }
    }
  },

  onConnected: function() {
    this.addChatMessage("Conectado al servidor!", "system");
    if (this.player) {
      Network.send("JOIN", {
        name: this.player.name,
        className: this.player.className,
        mapId: this.currentMapId
      });
    }
  },

  onDisconnected: function() {
    this.state = "disconnected";
    this.addChatMessage("Desconectado del servidor.", "system");
  },

  handleServerMessage: function(type, data) {
    var handler = this["on" + type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()];
    if (handler) {
      handler(data);
    }
  },

  selectClass: function(className) {
    this.selectedClass = className;
    var classDef = GameData.getClass(className);
    if (!classDef) return;

    document.getElementById("mainMenu").classList.add("hidden");

    this.player = new Player("local", "Jugador", className, classDef.startingX, classDef.startingY);
    this.player.isLocal = true;
    this.player.checkNewSkills();

    var self = this;
    var nameInput = document.createElement("div");
    nameInput.className = "panel-overlay";
    nameInput.innerHTML =
      '<div class="panel-content" style="text-align:center;">' +
        '<h2 style="color:#e94560;margin-bottom:16px;">Nombre del Personaje</h2>' +
        '<input type="text" id="charNameInput" class="server-input" placeholder="Escribe tu nombre..." maxlength="20" style="width:100%;margin-bottom:16px;">' +
        '<button id="startGameBtn" class="select-btn" style="width:100%;">Comenzar</button>' +
      '</div>';
    document.body.appendChild(nameInput);

    document.getElementById("startGameBtn").addEventListener("click", function() {
      var name = document.getElementById("charNameInput").value.trim();
      if (name.length < 2) {
        alert("El nombre debe tener al menos 2 caracteres.");
        return;
      }
      nameInput.remove();
      self.startGame(name, className);
    });

    document.getElementById("charNameInput").addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        document.getElementById("startGameBtn").click();
      }
    });

    setTimeout(function() {
      var inp = document.getElementById("charNameInput");
      if (inp) inp.focus();
    }, 100);
  },

  startGame: function(playerName, className) {
    this.player.name = playerName;
    this.player.className = className;
    var classDef = GameData.getClass(className);
    if (classDef) {
      this.currentMapId = classDef.startingMap;
      this.player.x = classDef.startingX;
      this.player.y = classDef.startingY;
      this.player.targetX = classDef.startingX;
      this.player.targetY = classDef.startingY;
    }

    var serverInput = document.getElementById("serverIp");
    var url = serverInput ? serverInput.value.trim() : "localhost";
    if (url && url.indexOf("://") === -1) {
      url = "ws://" + url + ":8899/ws";
    }

    this.loadMap(this.currentMapId);
    this.connectToServer(url);

    document.getElementById("gameHud").classList.remove("hidden");
    document.getElementById("joystickArea").classList.remove("hidden");
    document.getElementById("skillBar").classList.remove("hidden");
    document.getElementById("potionButtons").classList.remove("hidden");
    document.getElementById("chatBox").classList.remove("hidden");
    document.getElementById("minimap").classList.remove("hidden");

    this.start();
    this.addChatMessage("Bienvenido a Mu Online, " + playerName + "!", "system");
  },

  loadMap: function(mapId) {
    var mapDef = GameData.getMap(mapId);
    if (!mapDef) {
      mapDef = GameData.getMap("lorencia");
    }
    this.currentMap = mapDef;
    this.currentMapId = mapId;
    this.monsters = {};
    this.npcs = {};
    this.drops = [];

    if (mapDef.npcs) {
      for (var i = 0; i < mapDef.npcs.length; i++) {
        var npcId = mapDef.npcs[i];
        var npcDef = GameData.getNpc(npcId);
        if (npcDef) {
          this.npcs[npcId] = new Npc(npcId, npcDef);
        }
      }
    }

    if (mapDef.spawnPoints) {
      for (var j = 0; j < mapDef.spawnPoints.length; j++) {
        var spawn = mapDef.spawnPoints[j];
        var monDef = GameData.getMonster(spawn.monsterId);
        if (monDef) {
          var monId = "monster_" + (this.monsterIdCounter++);
          this.monsters[monId] = new Monster(monId, spawn.monsterId, spawn.x, spawn.y, monDef);
        }
      }
    }

    var mapName = document.getElementById("minimapName");
    if (mapName) mapName.textContent = mapDef.name || mapId;
  },

  showDeathOverlay: function() {
    var overlay = document.getElementById("deathOverlay");
    if (overlay) overlay.classList.remove("hidden");
    var timer = document.getElementById("deathTimer");
    if (timer) timer.textContent = "3";
    var self = this;
    if (this._deathCountdown) clearInterval(this._deathCountdown);
    this._deathCountdown = setInterval(function() {
      var el = document.getElementById("deathTimer");
      if (el) {
        var val = parseInt(el.textContent) - 1;
        if (val <= 0) { clearInterval(self._deathCountdown); return; }
        el.textContent = val;
      }
    }, 1000);
  },

  hideDeathOverlay: function() {
    var overlay = document.getElementById("deathOverlay");
    if (overlay) overlay.classList.add("hidden");
    if (this._deathCountdown) {
      clearInterval(this._deathCountdown);
      this._deathCountdown = null;
    }
  },

  useSkill: function(slotIndex) {
    if (!this.player || this.state !== "playing" || !this.player.isAlive) return;
    var skillId = this.player.skillBar[slotIndex];
    if (!skillId) return;
    var skill = GameData.getSkill(skillId);
    if (!skill) return;

    if (this.player.attackTimer > 0) return;
    if (this.player.mp < skill.manaCost) {
      this.addChatMessage("No tienes suficiente MP!", "system");
      return;
    }

    this.player.mp -= skill.manaCost;
    this.player.attackTimer = skill.cooldown || 0.8;
    this.player.direction = "down";

    var monsterId = null;
    var nearestDist = Infinity;
    var mKeys = Object.keys(this.monsters);
    for (var i = 0; i < mKeys.length; i++) {
      var m = this.monsters[mKeys[i]];
      if (!m || !m.isAlive) continue;
      var dx = m.x - this.player.x;
      var dy = m.y - this.player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist && dist <= skill.range) {
        nearestDist = dist;
        monsterId = mKeys[i];
      }
    }

    if (monsterId) {
      var target = this.monsters[monsterId];
      var hasLuck = false;
      if (this.player.equipment && this.player.equipment.weapon) {
        hasLuck = this.player.equipment.weapon.luck || false;
      }

      if (skill.type === "buff") {
        if (skill.hpMultiplier) {
          this.player.maxHp = Math.floor(this.player.maxHp * skill.hpMultiplier);
          this.player.hp = Math.min(this.player.hp, this.player.maxHp);
        }
        if (skill.atkMultiplier) {
          this.player.attackMin = Math.floor(this.player.attackMin * skill.atkMultiplier);
          this.player.attackMax = Math.floor(this.player.attackMax * skill.atkMultiplier);
        }
        if (skill.defMultiplier) {
          this.player.defense = Math.floor(this.player.defense * skill.defMultiplier);
        }
        this.addChatMessage("Usaste " + skill.name + "!", "system");
        Network.send("USE_SKILL", { skillId: skillId, targetId: monsterId });
        return;
      }

      if (skill.type === "heal") {
        var healAmt = Math.floor(this.player.maxHp * (skill.healPercent || 0.3));
        this.player.heal(healAmt);
        Renderer.addHealPopup(this.player.x, this.player.y - 0.5, healAmt);
        this.addChatMessage("Te curaste " + healAmt + " HP!", "system");
        Network.send("USE_SKILL", { skillId: skillId, targetId: null });
        return;
      }

      if (skill.type === "teleport") {
        var tx = this.player.x + (this.player.direction === "right" ? skill.range : this.player.direction === "left" ? -skill.range : 0);
        var ty = this.player.y + (this.player.direction === "down" ? skill.range : this.player.direction === "up" ? -skill.range : 0);
        tx = Math.max(0, Math.min(this.currentMap ? this.currentMap.width - 1 : 80, tx));
        ty = Math.max(0, Math.min(this.currentMap ? this.currentMap.height - 1 : 80, ty));
        this.player.x = tx;
        this.player.y = ty;
        this.player.targetX = tx;
        this.player.targetY = ty;
        Network.send("USE_SKILL", { skillId: skillId, x: tx, y: ty });
        return;
      }

      var result;
      if (skill.areaOfEffect > 0) {
        result = CombatSystem.processAoE(target.x, target.y, skill.areaOfEffect, this.player, skill);
        for (var r = 0; r < result.length; r++) {
          if (result[r].isHit) {
            Renderer.addDamagePopup(target.x, target.y - 0.5, result[r].damage, result[r].isCrit);
          }
        }
        if (skill.type.indexOf("projectile") >= 0 || skill.type === "ranged") {
          var proj = new Projectile(
            skillId, this.player.x, this.player.y, target.x, target.y,
            0, 8, true, skill.areaOfEffect, skill.damageModifier
          );
          this.projectiles.push(proj);
        }
      } else {
        result = CombatSystem.executePlayerAttack(this.player, target, skillId);
        if (result.isHit) {
          Renderer.addDamagePopup(target.x, target.y - 0.5, result.damage, result.isCrit);
        }
        if (skill.type.indexOf("projectile") >= 0 || skill.type === "ranged") {
          var proj2 = new Projectile(
            skillId, this.player.x, this.player.y, target.x, target.y,
            result.damage, 8, false, 0, skill.damageModifier
          );
          this.projectiles.push(proj2);
        }
      }

      if (result && result.isKill) {
        var xpReward = CombatSystem.calculateXpReward(target.def.level, this.player.level, target.def.xp);
        this.player.addXp(xpReward);
        this.addChatMessage("+" + xpReward + " XP (" + target.def.name + ")", "system");
        Renderer.addDamagePopup(target.x, target.y - 0.5, xpReward, false);
      }

      Network.send("USE_SKILL", { skillId: skillId, targetId: monsterId });
    } else {
      this.addChatMessage("No hay enemigos cerca!", "system");
    }
  },

  usePotion: function(slot) {
    if (!this.player || this.state !== "playing" || !this.player.isAlive) return;
    var used = this.player.usePotion(slot);
    if (used) {
      this.updateHUD();
      Network.send("USE_POTION", { slot: slot });
    } else {
      this.addChatMessage("No tienes pociones de " + (slot === "hp" ? "HP" : "MP") + "!", "system");
    }
  },

  addChatMessage: function(text, type) {
    var container = document.getElementById("chatMessages");
    if (!container) return;
    var msg = document.createElement("p");
    msg.className = "chat-msg " + (type === "system" ? "system" : "player");
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    if (container.children.length > 50) {
      container.removeChild(container.firstChild);
    }
  },

  toggleInventory: function() {
    var panel = document.getElementById("inventoryPanel");
    if (!panel) return;
    var isHidden = panel.classList.contains("hidden");
    if (isHidden) {
      this.showInventory();
    } else {
      panel.classList.add("hidden");
    }
  },

  showInventory: function() {
    var panel = document.getElementById("inventoryPanel");
    if (!panel || !this.player) return;
    panel.classList.remove("hidden");

    var slotEls = document.querySelectorAll(".inv-slot");
    for (var i = 0; i < slotEls.length; i++) {
      var se = slotEls[i];
      var idx = parseInt(se.getAttribute("data-index"));
      if (idx >= 0 && idx < (this.player.inventory || []).length) {
        var item = this.player.inventory[idx];
        if (item) {
          se.textContent = item.name || item.id;
          se.style.fontSize = "9px";
          se.style.background = "rgba(255,255,255,0.1)";
          se.style.borderColor = "rgba(255,255,255,0.2)";
        } else {
          se.textContent = "";
          se.style.background = "";
          se.style.borderColor = "";
        }
      } else {
        se.textContent = "";
        se.style.background = "";
        se.style.borderColor = "";
      }
    }

    var equipSlots = document.querySelectorAll(".equip-slot");
    for (var j = 0; j < equipSlots.length; j++) {
      var es = equipSlots[j];
      var slotName = es.getAttribute("data-slot");
      var eqItem = this.player.equipment[slotName];
      if (eqItem) {
        es.textContent = eqItem.name || eqItem.id;
        es.style.fontSize = "9px";
        es.style.borderStyle = "solid";
      } else {
        var defaults = {
          weapon: "Arma", helm: "Casco", armor: "Armadura",
          pants: "Pantalones", gloves: "Guantes", boots: "Botas"
        };
        es.textContent = defaults[slotName] || slotName;
        es.style.fontSize = "10px";
        es.style.borderStyle = "dashed";
      }
    }

    var invGold = document.getElementById("invGoldAmount");
    if (invGold) invGold.textContent = this.player.gold || 0;
  },

  toggleCharacterPanel: function() {
    var panel = document.getElementById("characterPanel");
    if (!panel) return;
    var isHidden = panel.classList.contains("hidden");
    if (isHidden) {
      this.showCharacterPanel();
    } else {
      panel.classList.add("hidden");
    }
  },

  showCharacterPanel: function() {
    var panel = document.getElementById("characterPanel");
    if (!panel || !this.player) return;
    panel.classList.remove("hidden");

    var classNames = { dark_knight: "Dark Knight", elf: "Elf", mago: "Mago" };
    document.getElementById("statLevel").textContent = this.player.level;
    document.getElementById("statClass").textContent = classNames[this.player.className] || this.player.className;
    document.getElementById("statStr").textContent = this.player.str;
    document.getElementById("statAgi").textContent = this.player.agi;
    document.getElementById("statVit").textContent = this.player.vit;
    document.getElementById("statEne").textContent = this.player.ene;
    document.getElementById("statHp").textContent = Math.round(this.player.hp) + "/" + Math.round(this.player.maxHp);
    document.getElementById("statMp").textContent = Math.round(this.player.mp) + "/" + Math.round(this.player.maxMp);
    document.getElementById("statAtk").textContent = this.player.attackMin + " - " + this.player.attackMax;
    document.getElementById("statDef").textContent = this.player.defense;
    document.getElementById("statWiz").textContent = Math.floor((this.player.wizRaise || 0) * 100) + "%";
  },

  handleClick: function(screenX, screenY, worldX, worldY) {
    if (this.state !== "playing" || !this.player) return;

    var nKeys = Object.keys(this.npcs);
    for (var k = 0; k < nKeys.length; k++) {
      var npc = this.npcs[nKeys[k]];
      if (!npc) continue;
      var ndx = npc.x - worldX;
      var ndy = npc.y - worldY;
      if (Math.abs(ndx) < 1.5 && Math.abs(ndy) < 1.5) {
        var nDef = GameData.getNpc(npc.id);
        if (nDef && nDef.shopItemIds && nDef.shopItemIds.length > 0) {
          this.openShop(nDef);
        } else {
          this.addChatMessage(npc.name + ": Hola, " + this.player.name + "!", "system");
        }
        return;
      }
    }

    var mKeys = Object.keys(this.monsters);
    for (var i = 0; i < mKeys.length; i++) {
      var m = this.monsters[mKeys[i]];
      if (!m || !m.isAlive) continue;
      var dx = m.x - worldX;
      var dy = m.y - worldY;
      if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) {
        this.useSkill(0);
        return;
      }
    }

    if (this.currentMap && this.currentMap.tileData) {
      var ty = this.currentMap.tileData[worldY];
      if (ty !== undefined && ty[worldX] !== undefined && ty[worldX] === 0) {
        this.player.targetX = worldX + 0.5;
        this.player.targetY = worldY + 0.5;
      }
    }
  },

  handleNpcInteraction: function() {
    if (!this.player || this.state !== "playing") return;
    var npcKeys = Object.keys(this.npcs);
    for (var i = 0; i < npcKeys.length; i++) {
      var npc = this.npcs[npcKeys[i]];
      if (npc && npc.isPlayerInRange(this.player)) {
        var npcDef = GameData.getNpc(npc.id);
        if (npcDef && npcDef.shopItemIds && npcDef.shopItemIds.length > 0) {
          this.openShop(npcDef);
        } else {
          this.addChatMessage(npc.name + ": Hola, " + this.player.name + "!", "system");
        }
        return;
      }
    }
  },

  openShop: function(npcDef) {
    var panel = document.getElementById("shopPanel");
    if (!panel) return;
    panel.classList.remove("hidden");

    var title = document.getElementById("shopTitle");
    if (title) title.textContent = "Tienda - " + npcDef.name;

    var container = document.getElementById("shopItems");
    if (!container) return;
    container.innerHTML = "";

    var items = npcDef.shopItemIds || [];
    for (var i = 0; i < items.length; i++) {
      var itemDef = GameData.getItem(items[i]);
      if (!itemDef) continue;
      var div = document.createElement("div");
      div.className = "shop-item";

      var info = document.createElement("div");
      info.className = "shop-item-info";
      var nameSpan = document.createElement("div");
      nameSpan.className = "shop-item-name";
      nameSpan.textContent = itemDef.name;
      var priceSpan = document.createElement("div");
      priceSpan.className = "shop-item-price";
      priceSpan.textContent = itemDef.value + " oro";
      var descSpan = document.createElement("div");
      descSpan.className = "shop-item-desc";
      var descParts = [];
      if (itemDef.attackMin) descParts.push("ATK: " + itemDef.attackMin + "-" + itemDef.attackMax);
      if (itemDef.defense) descParts.push("DEF: " + itemDef.defense);
      if (itemDef.wizRaise) descParts.push("Wiz: " + Math.floor(itemDef.wizRaise * 100) + "%");
      if (itemDef.hpRestore) descParts.push("Cura " + itemDef.hpRestore + " HP");
      if (itemDef.mpRestore) descParts.push("Restaura " + itemDef.mpRestore + " MP");
      descSpan.textContent = descParts.join(" | ");

      info.appendChild(nameSpan);
      info.appendChild(priceSpan);
      if (descParts.length > 0) info.appendChild(descSpan);
      div.appendChild(info);

      var buyBtn = document.createElement("button");
      buyBtn.className = "shop-buy-btn";
      buyBtn.textContent = "Comprar";
      var self = this;
      (function(itemId, cost) {
        buyBtn.addEventListener("click", function() {
          if (self.player && self.player.gold >= cost && self.player.inventory.length < 16) {
            self.player.gold -= cost;
            var boughtItem = {};
            for (var key in itemDef) {
              if (itemDef.hasOwnProperty(key)) boughtItem[key] = itemDef[key];
            }
            boughtItem.instanceId = "shop_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
            self.player.inventory.push(boughtItem);
            self.addChatMessage("Compraste " + itemDef.name + " por " + cost + " oro", "system");
            self.updateHUD();
            Network.send("BUY_ITEM", { itemId: itemId, price: cost });
            var goldSpan = document.getElementById("shopGoldAmount");
            if (goldSpan) goldSpan.textContent = self.player.gold;
          } else if (self.player && self.player.gold < cost) {
            self.addChatMessage("No tienes suficiente oro!", "system");
          } else {
            self.addChatMessage("Inventario lleno!", "system");
          }
        });
      })(items[i], itemDef.value);
      div.appendChild(buyBtn);
      container.appendChild(div);
    }

    var goldSpan = document.getElementById("shopGoldAmount");
    if (goldSpan && this.player) goldSpan.textContent = this.player.gold;
  },

  onWorldState: function(data) {
    if (data.players) {
      for (var i = 0; i < data.players.length; i++) {
        var pd = data.players[i];
        if (pd.id !== this.player.id) {
          var existing = this.otherPlayers[pd.id];
          if (!existing) {
            var p = new Player(pd.id, pd.name, pd.className, pd.x, pd.y);
            p.level = pd.level || 1;
            p.hp = pd.hp || 100;
            p.maxHp = pd.maxHp || 100;
            p.isLocal = false;
            this.otherPlayers[pd.id] = p;
          } else {
            existing.targetX = pd.x;
            existing.targetY = pd.y;
            existing.level = pd.level || existing.level;
            existing.hp = pd.hp || existing.hp;
            existing.maxHp = pd.maxHp || existing.maxHp;
          }
        }
      }
    }

    if (data.monsters) {
      for (var j = 0; j < data.monsters.length; j++) {
        var md = data.monsters[j];
        var existingMon = this.monsters[md.id];
        if (existingMon) {
          existingMon.x = md.x;
          existingMon.y = md.y;
          existingMon.hp = md.hp || existingMon.hp;
          existingMon.maxHp = md.maxHp || existingMon.maxHp;
          existingMon.isAlive = md.isAlive !== false;
        } else {
          var monDef = GameData.getMonster(md.defId);
          if (monDef) {
            this.monsters[md.id] = new Monster(md.id, md.defId, md.x, md.y, monDef);
          }
        }
      }
    }
  },

  onPlayerJoined: function(data) {
    if (data.id === this.player.id) return;
    var existing = this.otherPlayers[data.id];
    if (!existing) {
      var p = new Player(data.id, data.name, data.className, data.x, data.y);
      p.level = data.level || 1;
      p.hp = data.hp || 100;
      p.maxHp = data.maxHp || 100;
      p.isLocal = false;
      this.otherPlayers[data.id] = p;
      this.addChatMessage(data.name + " se ha conectado.", "system");
    }
  },

  onPlayerLeft: function(data) {
    if (data.id && this.otherPlayers[data.id]) {
      var name = this.otherPlayers[data.id].name;
      delete this.otherPlayers[data.id];
      this.addChatMessage(name + " se ha desconectado.", "system");
    }
  },

  onPlayerMoved: function(data) {
    if (!data.id || data.id === this.player.id) return;
    var p = this.otherPlayers[data.id];
    if (p) {
      p.targetX = data.x;
      p.targetY = data.y;
      if (data.direction) p.direction = data.direction;
    }
  },

  onDamageDealt: function(data) {
    var target = null;
    if (data.targetId === this.player.id) {
      target = this.player;
    } else if (this.otherPlayers[data.targetId]) {
      target = this.otherPlayers[data.targetId];
    } else if (this.monsters[data.targetId]) {
      target = this.monsters[data.targetId];
    }
    if (target) {
      target.hp = data.hp !== undefined ? data.hp : (target.hp - (data.damage || 0));
      target.maxHp = data.maxHp || target.maxHp;
      if (target.hp <= 0) {
        target.hp = 0;
        target.isAlive = false;
      }
      if (data.damage) {
        Renderer.addDamagePopup(target.x, target.y - 0.5, data.damage, data.isCrit || false);
      }
    }
  },

  onItemDropped: function(data) {
    var drop = new DropItem(data.itemDefId, data.instanceId, data.x, data.y);
    this.drops.push(drop);
    if (data.ownerName) {
      this.addChatMessage(data.ownerName + " dejo caer " + (drop.definition ? drop.definition.name : data.itemDefId), "system");
    }
  },

  onLevelUp: function(data) {
    if (this.player && data.playerId === this.player.id) {
      this.player.level = data.level || this.player.level + 1;
      this.player.statPoints = data.statPoints || (this.player.statPoints + (GameData.getClass(this.player.className) ? GameData.getClass(this.player.className).pointsPerLevel : 5));
      this.player.maxHp = data.maxHp || this.player.maxHp;
      this.player.maxMp = data.maxMp || this.player.maxMp;
      this.player.hp = data.hp || this.player.maxHp;
      this.player.mp = data.mp || this.player.maxMp;
      this.player.calculateStats();
      this.player.checkNewSkills();
      this.addChatMessage("Has subido al nivel " + this.player.level + "!", "system");
      this.updateHUD();
    }
  },

  onChatMessage: function(data) {
    var sender = data.sender || "Desconocido";
    var message = data.message || "";
    this.addChatMessage(sender + ": " + message, "player");
  },

  onMapLoaded: function(data) {
    if (data.mapId) {
      this.loadMap(data.mapId);
      if (data.x !== undefined) {
        this.player.x = data.x;
        this.player.y = data.y;
        this.player.targetX = data.x;
        this.player.targetY = data.y;
      }
      this.addChatMessage("Has entrado a " + (GameData.getMap(data.mapId) ? GameData.getMap(data.mapId).name : data.mapId), "system");
    }
  },

  onInventoryUpdate: function(data) {
    if (!this.player) return;
    this.player.inventory = data.items || [];
    this.player.gold = data.gold || this.player.gold;
    this.updateHUD();
    if (!document.getElementById("inventoryPanel").classList.contains("hidden")) {
      this.showInventory();
    }
  },

  onEquipmentUpdate: function(data) {
    if (!this.player) return;
    this.player.equipment = data.equipment || {};
    this.player.calculateStats();
    this.updateHUD();
  },

  onShopInventory: function(data) {
    this.openShop({ name: data.shopName || "Tienda", shopItemIds: data.items || [] });
  },

  onXpGained: function(data) {
    if (this.player) {
      this.player.addXp(data.amount || 0);
      if (data.monsterName) {
        this.addChatMessage("+" + data.amount + " XP (" + data.monsterName + ")", "system");
      }
      this.updateHUD();
    }
  },

  onStatUpdate: function(data) {
    if (!this.player) return;
    this.player.str = data.str || this.player.str;
    this.player.agi = data.agi || this.player.agi;
    this.player.vit = data.vit || this.player.vit;
    this.player.ene = data.ene || this.player.ene;
    this.player.statPoints = data.statPoints || this.player.statPoints;
    this.player.calculateStats();
    this.updateHUD();
  },

  onMonsterMoved: function(data) {
    var mon = this.monsters[data.id];
    if (mon) {
      mon.targetX = data.x;
      mon.targetY = data.y;
      mon.x = data.x;
      mon.y = data.y;
      if (data.hp !== undefined) {
        mon.hp = data.hp;
        mon.maxHp = data.maxHp || mon.maxHp;
      }
      mon.isAlive = data.isAlive !== false;
    }
  },

  onGameMessage: function(data) {
    var msg = data.message || data.text || "";
    this.addChatMessage(msg, "system");
  },

  onError: function(data) {
    var msg = data.message || "Error desconocido";
    this.addChatMessage("Error: " + msg, "system");
    console.error("Server error:", msg);
  }
};

document.addEventListener("DOMContentLoaded", function() {
  Game.init();
});
