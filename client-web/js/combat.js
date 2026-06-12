const CombatSystem = {
  calculateDamage: function(attacker, defender, skillModifier) {
    skillModifier = skillModifier || 1.0;
    var baseMin = 0;
    var baseMax = 0;
    var defense = defender.defense || 0;
    var weaponAtkMin = 0;
    var weaponAtkMax = 0;
    var wizRaise = 0;

    if (attacker instanceof Player) {
      if (attacker.equipment && attacker.equipment.weapon) {
        weaponAtkMin = attacker.equipment.weapon.attackMin || 0;
        weaponAtkMax = attacker.equipment.weapon.attackMax || 0;
        wizRaise = attacker.equipment.weapon.wizRaise || 0;
      }

      if (attacker.className === "dark_knight" || attacker.className === "Dark Knight") {
        baseMin = Math.floor(attacker.str / 4) + weaponAtkMin;
        baseMax = Math.floor(attacker.str / 4) + weaponAtkMax;
      } else if (attacker.className === "elf" || attacker.className === "Elf") {
        baseMin = Math.floor(attacker.agi / 5) + weaponAtkMin;
        baseMax = Math.floor(attacker.agi / 5) + weaponAtkMax;
      } else if (attacker.className === "mago" || attacker.className === "Mago") {
        baseMin = Math.floor(attacker.ene / 4) + weaponAtkMin + Math.floor(wizRaise * attacker.ene / 9);
        baseMax = Math.floor(attacker.ene / 4) + weaponAtkMax + Math.floor(wizRaise * attacker.ene / 9);
        defense = Math.floor(defense / 2);
      } else {
        baseMin = weaponAtkMin;
        baseMax = weaponAtkMax;
      }
    } else if (attacker instanceof Monster) {
      baseMin = attacker.def.atkMin || 0;
      baseMax = attacker.def.atkMax || 0;
    } else {
      baseMin = 5;
      baseMax = 10;
    }

    if (skillModifier > 1.0 && attacker instanceof Player) {
      baseMin = Math.floor(baseMin * skillModifier);
      baseMax = Math.floor(baseMax * skillModifier);
    }

    var rawDamage = baseMin + Math.floor(Math.random() * (baseMax - baseMin + 1));
    var finalDamage = Math.max(1, rawDamage - Math.floor(defense * 0.5));

    var minDamage = Math.floor(baseMax * 0.05);
    if (finalDamage < minDamage) {
      finalDamage = minDamage;
    }

    return finalDamage;
  },

  calculateHitChance: function(attackerRate, defenderRate) {
    var total = attackerRate + defenderRate;
    if (total <= 0) return true;
    var hitChance = (attackerRate / total) * 100;
    return Math.random() * 100 < hitChance;
  },

  calculateCritChance: function(hasLuck) {
    return hasLuck ? 10 : 5;
  },

  calculateXpReward: function(monsterLevel, playerLevel, baseXp) {
    var diff = playerLevel - monsterLevel;
    var multiplier = 1.0;
    if (diff > 0) {
      multiplier = Math.max(0.1, 1.0 - diff * 0.1);
    } else if (diff < 0) {
      multiplier = Math.min(1.5, 1.0 - diff * 0.1);
    }
    return Math.max(1, Math.floor(baseXp * multiplier));
  },

  executeAttack: function(attacker, defender, skillId) {
    var skill = null;
    var skillModifier = 1.0;
    var hasLuck = false;
    var attackerAtkRate = 0;
    var defenderDefRate = 0;

    if (skillId) {
      skill = GameData.getSkill(skillId);
      if (skill) {
        skillModifier = skill.damageModifier || 1.0;
      }
    }

    if (attacker instanceof Player) {
      attackerAtkRate = attacker.level * 5 + attacker.agi + attacker.str;
      if (attacker.equipment && attacker.equipment.weapon) {
        hasLuck = attacker.equipment.weapon.luck || false;
      }
    } else if (attacker instanceof Monster) {
      attackerAtkRate = attacker.def.atkRate || 20;
    } else {
      attackerAtkRate = 20;
    }

    if (defender instanceof Player) {
      defenderDefRate = defender.level * 5 + defender.agi + Math.floor(defender.defense * 0.5);
    } else if (defender instanceof Monster) {
      defenderDefRate = defender.def.defRate || 5;
    } else {
      defenderDefRate = 5;
    }

    var isHit = this.calculateHitChance(attackerAtkRate, defenderDefRate);
    if (!isHit) {
      return { damage: 0, isHit: false, isCrit: false, isKill: false };
    }

    var damage = this.calculateDamage(attacker, defender, skillModifier);
    var critChance = this.calculateCritChance(hasLuck);
    var isCrit = Math.random() * 100 < critChance;

    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    defender.takeDamage(damage);
    var isKill = !defender.isAlive;

    return {
      damage: damage,
      isHit: isHit,
      isCrit: isCrit,
      isKill: isKill
    };
  },

  executePlayerAttack: function(attacker, defender, skillId) {
    var skill = null;
    var skillModifier = 1.0;

    if (skillId) {
      skill = GameData.getSkill(skillId);
      if (skill) {
        skillModifier = skill.damageModifier || 1.0;
      }
    }

    var baseAtkRate = attacker.level * 5 + attacker.agi + attacker.str;
    var defRate = (defender instanceof Monster) ? (defender.def.defRate || 5) : (defender.level * 5 + defender.agi + Math.floor(defender.defense * 0.5));

    var isHit = this.calculateHitChance(baseAtkRate, defRate);
    if (!isHit) {
      return { damage: 0, isHit: false, isCrit: false, isKill: false };
    }

    var damage = this.calculateDamage(attacker, defender, skillModifier);
    var hasLuck = false;
    if (attacker.equipment && attacker.equipment.weapon) {
      hasLuck = attacker.equipment.weapon.luck || false;
    }
    var critChance = this.calculateCritChance(hasLuck);
    var isCrit = Math.random() * 100 < critChance;

    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    var result = defender.takeDamage(damage);
    if (result && result.hp !== undefined) {
      defender.hp = result.hp;
      defender.maxHp = result.maxHp;
    }
    var isKill = !defender.isAlive;

    return {
      damage: damage,
      isHit: isHit,
      isCrit: isCrit,
      isKill: isKill
    };
  },

  processAoE: function(centerX, centerY, radius, attacker, skill) {
    var skillModifier = skill ? (skill.damageModifier || 1.0) : 1.0;
    var results = [];

    var allTargets = [];
    if (Game.monsters) {
      var mKeys = Object.keys(Game.monsters);
      for (var i = 0; i < mKeys.length; i++) {
        var m = Game.monsters[mKeys[i]];
        if (m && m.isAlive) {
          var dx = m.x - centerX;
          var dy = m.y - centerY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            allTargets.push(m);
          }
        }
      }
    }

    for (var j = 0; j < allTargets.length; j++) {
      var target = allTargets[j];
      var result = this.executePlayerAttack(attacker, target, skill ? skill.id : null);
      result.target = target;
      results.push(result);
      if (result.isHit) {
        Renderer.addDamagePopup(target.x, target.y - 0.5, result.damage, result.isCrit);
      }
    }

    return results;
  }
};
