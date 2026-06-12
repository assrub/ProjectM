function Player(id, name, className, x, y) {
  this.id = id;
  this.name = name;
  this.className = className;
  this.x = x;
  this.y = y;
  this.targetX = x;
  this.targetY = y;
  this.level = 1;
  this.xp = 0;
  this.hp = 100;
  this.maxHp = 100;
  this.mp = 50;
  this.maxMp = 50;
  this.str = 10;
  this.agi = 10;
  this.vit = 10;
  this.ene = 10;
  this.statPoints = 0;
  this.attackMin = 5;
  this.attackMax = 10;
  this.defense = 2;
  this.moveSpeed = 3;
  this.isAlive = true;
  this.direction = "down";
  this.isMoving = false;
  this.inventory = [];
  this.equipment = {};
  this.gold = 0;
  this.skills = [];
  this.skillBar = [];
  this.sprite = null;
  this.isLocal = false;
  this.attackTimer = 0;
  this.wizRaise = 0;

  var classDef = GameData.getClass(className);
  if (classDef) {
    this.str = classDef.baseStats.str;
    this.agi = classDef.baseStats.agi;
    this.vit = classDef.baseStats.vit;
    this.ene = classDef.baseStats.ene;
    this.hp = 100 + this.vit * 2;
    this.maxHp = this.hp;
    this.mp = 10 + this.ene * 1.5;
    this.maxMp = this.mp;
    this.calculateStats();
  }

  this.calculateStats = function() {
    var weapon = this.equipment.weapon || null;
    var weaponAtkMin = weapon ? (weapon.attackMin || 0) : 0;
    var weaponAtkMax = weapon ? (weapon.attackMax || 0) : 0;
    var armorDef = 0;
    var helmDef = 0;
    var pantsDef = 0;
    var glovesDef = 0;
    var bootsDef = 0;
    var totalWizRaise = 0;

    if (this.equipment.armor) armorDef = this.equipment.armor.defense || 0;
    if (this.equipment.helm) helmDef = this.equipment.helm.defense || 0;
    if (this.equipment.pants) pantsDef = this.equipment.pants.defense || 0;
    if (this.equipment.gloves) glovesDef = this.equipment.gloves.defense || 0;
    if (this.equipment.boots) bootsDef = this.equipment.boots.defense || 0;
    if (weapon) totalWizRaise = weapon.wizRaise || 0;

    var combinedDef = armorDef + helmDef + pantsDef + glovesDef + bootsDef;

    if (this.className === "dark_knight" || this.className === "Dark Knight") {
      this.attackMin = Math.floor(this.str / 4) + weaponAtkMin;
      this.attackMax = Math.floor(this.str / 4) + weaponAtkMax;
      this.wizRaise = 0;
    } else if (this.className === "elf" || this.className === "Elf") {
      this.attackMin = Math.floor(this.agi / 5) + weaponAtkMin;
      this.attackMax = Math.floor(this.agi / 5) + weaponAtkMax;
      this.wizRaise = 0;
    } else if (this.className === "mago" || this.className === "Mago") {
      this.attackMin = Math.floor(this.ene / 4) + weaponAtkMin;
      this.attackMax = Math.floor(this.ene / 4) + weaponAtkMax;
      this.wizRaise = totalWizRaise;
    }

    this.defense = Math.floor(this.agi / 5) + combinedDef;
    this.maxHp = 100 + this.vit * 2 + this.level * 2;
    this.maxMp = 10 + this.ene * 1.5 + this.level;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.mp > this.maxMp) this.mp = this.maxMp;
  };

  this.takeDamage = function(damage) {
    if (!this.isAlive) return;
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
  };

  this.heal = function(amount) {
    if (!this.isAlive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  };

  this.restoreMp = function(amount) {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  };

  this.addXp = function(amount) {
    if (!this.isAlive) return;
    this.xp += amount;
    var needed = Player.getXpForLevel(this.level);
    while (this.xp >= needed) {
      this.xp -= needed;
      this.levelUp();
      needed = Player.getXpForLevel(this.level);
    }
  };

  this.levelUp = function() {
    this.level++;
    this.statPoints += GameData.getClass(this.className) ? GameData.getClass(this.className).pointsPerLevel : 5;
    this.maxHp = 100 + this.vit * 2 + this.level * 2;
    this.maxMp = 10 + this.ene * 1.5 + this.level;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.calculateStats();
    this.checkNewSkills();
  };

  this.checkNewSkills = function() {
    var classDef = GameData.getClass(this.className);
    if (!classDef) return;
    for (var i = 0; i < classDef.skillsAtLevels.length; i++) {
      var entry = classDef.skillsAtLevels[i];
      if (entry.level <= this.level) {
        var alreadyHas = false;
        for (var j = 0; j < this.skills.length; j++) {
          if (this.skills[j] === entry.skillId) {
            alreadyHas = true;
            break;
          }
        }
        if (!alreadyHas) {
          this.skills.push(entry.skillId);
        }
      }
    }
    if (this.skillBar.length === 0 && this.skills.length > 0) {
      for (var k = 0; k < Math.min(6, this.skills.length); k++) {
        this.skillBar.push(this.skills[k]);
      }
    }
  };

  this.addStat = function(stat) {
    if (this.statPoints <= 0) return false;
    if (stat === "str") { this.str++; }
    else if (stat === "agi") { this.agi++; }
    else if (stat === "vit") { this.vit++; }
    else if (stat === "ene") { this.ene++; }
    else { return false; }
    this.statPoints--;
    this.calculateStats();
    return true;
  };

  this.equipItem = function(item) {
    if (!item || !item.slot) return false;
    var slot = item.slot;
    var oldItem = this.equipment[slot] || null;
    this.equipment[slot] = item;
    var idx = -1;
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i] && this.inventory[i].instanceId === item.instanceId) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      if (oldItem) {
        this.inventory[idx] = oldItem;
      } else {
        this.inventory.splice(idx, 1);
      }
    }
    this.calculateStats();
    return true;
  };

  this.unequipItem = function(slot) {
    var item = this.equipment[slot];
    if (!item) return false;
    if (this.inventory.length >= 16) return false;
    this.inventory.push(item);
    delete this.equipment[slot];
    this.calculateStats();
    return true;
  };

  this.usePotion = function(slot) {
    for (var i = 0; i < this.inventory.length; i++) {
      var item = this.inventory[i];
      if (item && item.type === "potion") {
        if (slot === "hp" && item.hpRestore > 0) {
          this.heal(item.hpRestore);
          this.inventory.splice(i, 1);
          return true;
        }
        if (slot === "mp" && item.mpRestore > 0) {
          this.restoreMp(item.mpRestore);
          this.inventory.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  };

  this.update = function(dt) {
    if (!this.isAlive) return;
    var dx = this.targetX - this.x;
    var dy = this.targetY - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var speed = this.moveSpeed * dt;

    if (dist > 0.1) {
      this.isMoving = true;
      var moveX = (dx / dist) * speed;
      var moveY = (dy / dist) * speed;
      if (Math.abs(moveX) > Math.abs(dx)) moveX = dx;
      if (Math.abs(moveY) > Math.abs(dy)) moveY = dy;
      this.x += moveX;
      this.y += moveY;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? "right" : "left";
      } else {
        this.direction = dy > 0 ? "down" : "up";
      }

      if (Math.abs(this.x - this.targetX) < 0.05 && Math.abs(this.y - this.targetY) < 0.05) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
      }
    } else {
      this.isMoving = false;
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer < 0) this.attackTimer = 0;
    }
  };
}

Player.getXpForLevel = function(level) {
  return level * level * (level + 9) * 10;
};

Player.calculateAttack = function(str, agi, ene, weaponAtkMin, weaponAtkMax, className, wizRaise) {
  if (className === "dark_knight" || className === "Dark Knight") {
    return Math.floor(str / 4) + weaponAtkMax;
  } else if (className === "elf" || className === "Elf") {
    return Math.floor(agi / 5) + weaponAtkMax;
  } else if (className === "mago" || className === "Mago") {
    return Math.floor(ene / 4) + weaponAtkMax + Math.floor(wizRaise * ene / 9);
  }
  return weaponAtkMax;
};

Player.calculateDefense = function(agi, armorDef) {
  return Math.floor(agi / 5) + armorDef;
};

function Monster(id, defId, x, y, definition) {
  this.id = id;
  this.defId = defId;
  this.def = definition;
  this.x = x;
  this.y = y;
  this.startX = x;
  this.startY = y;
  this.hp = definition.hp;
  this.maxHp = definition.hp;
  this.isAlive = true;
  this.state = "idle";
  this.targetX = x;
  this.targetY = y;
  this.targetPlayer = null;
  this.attackTimer = 0;
  this.sprite = null;
  this.direction = "down";
  this.patrolTimer = 0;
  this.respawnTimer = 0;

  this.update = function(dt, players) {
    if (!this.isAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.hp = this.def.hp;
        this.maxHp = this.def.hp;
        this.isAlive = true;
        this.state = "idle";
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = this.startX;
        this.targetY = this.startY;
      }
      return;
    }

    var nearest = this.findNearestPlayer(players);
    var aggroDist = this.def.aggroRange || 4;
    var attackDist = this.def.attackRange || 1.5;

    if (nearest) {
      var dx = nearest.x - this.x;
      var dy = nearest.y - this.y;
      var distToPlayer = Math.sqrt(dx * dx + dy * dy);

      if (distToPlayer <= aggroDist) {
        this.targetPlayer = nearest;

        if (distToPlayer <= attackDist) {
          this.state = "attack";
          this.attackTimer -= dt;
          if (this.attackTimer <= 0) {
            var dmg = CombatSystem.executeAttack(this, nearest, null);
            this.attackTimer = 2.0;
            return dmg;
          }
        } else {
          this.state = "chase";
          this.targetX = nearest.x;
          this.targetY = nearest.y;
        }
      } else {
        this.targetPlayer = null;
        this.state = "idle";
      }
    } else {
      this.targetPlayer = null;
      this.state = "idle";
    }

    if (this.state === "idle" || this.state === "patrol") {
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        var range = 3;
        this.targetX = this.startX + (Math.random() * range * 2 - range);
        this.targetY = this.startY + (Math.random() * range * 2 - range);
        this.targetX = Math.max(0, Math.min(Game.currentMap ? Game.currentMap.width - 1 : 80, Math.round(this.targetX)));
        this.targetY = Math.max(0, Math.min(Game.currentMap ? Game.currentMap.height - 1 : 80, Math.round(this.targetY)));
        this.patrolTimer = 2 + Math.random() * 3;
        this.state = "patrol";
      }
    }

    var mx = this.targetX - this.x;
    var my = this.targetY - this.y;
    var mdist = Math.sqrt(mx * mx + my * my);
    var mspeed = (this.def.moveSpeed || 2) * dt;

    if (mdist > 0.2) {
      this.x += (mx / mdist) * mspeed;
      this.y += (my / mdist) * mspeed;
      if (Math.abs(mx) > Math.abs(my)) {
        this.direction = mx > 0 ? "right" : "left";
      } else {
        this.direction = my > 0 ? "down" : "up";
      }
    }

    return null;
  };

  this.takeDamage = function(damage) {
    if (!this.isAlive) return null;
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    return { hp: this.hp, maxHp: this.maxHp };
  };

  this.die = function() {
    this.isAlive = false;
    this.state = "dead";
    this.respawnTimer = this.def.respawnTime || 15;
  };

  this.findNearestPlayer = function(players) {
    var nearest = null;
    var nearestDist = Infinity;
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      var p = players[keys[i]];
      if (!p || !p.isAlive) continue;
      var dx = p.x - this.x;
      var dy = p.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = p;
      }
    }
    return nearest;
  };
}

function Npc(id, definition) {
  this.id = id;
  this.def = definition;
  this.x = definition.x;
  this.y = definition.y;
  this.name = definition.name;
  this.sprite = null;
  this.interactionRange = 2;

  this.isPlayerInRange = function(player) {
    if (!player) return false;
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist <= this.interactionRange;
  };
}

function Projectile(type, startX, startY, targetX, targetY, damage, speed, isAoE, aoeRadius, skillModifier) {
  this.type = type || "fire_ball";
  this.x = startX;
  this.y = startY;
  this.startX = startX;
  this.startY = startY;
  this.targetX = targetX;
  this.targetY = targetY;
  this.damage = damage || 0;
  this.speed = speed || 8;
  this.isAoE = isAoE || false;
  this.aoeRadius = aoeRadius || 0;
  this.skillModifier = skillModifier || 1.0;
  this.alive = true;
  this.progress = 0;

  this.update = function(dt) {
    if (!this.alive) return;
    var dx = this.targetX - this.startX;
    var dy = this.targetY - this.startY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) {
      this.alive = false;
      return;
    }
    this.progress += (this.speed * dt) / dist;
    if (this.progress >= 1) {
      this.progress = 1;
      this.alive = false;
    }
    this.x = this.startX + dx * this.progress;
    this.y = this.startY + dy * this.progress;
  };
}

function DropItem(itemDefId, instanceId, x, y) {
  this.itemDefId = itemDefId;
  this.instanceId = instanceId;
  this.x = x;
  this.y = y;
  this.definition = GameData.getItem(itemDefId);
  this.destroyTimer = 60;
}
