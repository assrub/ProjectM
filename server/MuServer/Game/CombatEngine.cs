using MuServer.Data;

namespace MuServer.Game;

public static class CombatEngine
{
    public static int CalculateDamage(int atkMin, int atkMax, int attackerLevel, int def, int defenderLevel, double skillModifier)
    {
        int baseAtk = Random.Shared.Next(atkMin, atkMax + 1);
        double levelBonus = 1.0 + (attackerLevel - defenderLevel) * 0.02;
        if (levelBonus < 0.5) levelBonus = 0.5;
        if (levelBonus > 2.0) levelBonus = 2.0;

        double rawDamage = baseAtk * skillModifier * levelBonus;
        double mitigatedDamage = rawDamage - def * 0.3;
        return Math.Max(1, (int)Math.Round(mitigatedDamage));
    }

    public static int CalculateMagicDamage(int wizRaise, int attackerLevel, int def, int defenderLevel, double skillModifier)
    {
        int baseAtk = Random.Shared.Next(wizRaise / 2, wizRaise + 1);
        double levelBonus = 1.0 + (attackerLevel - defenderLevel) * 0.02;
        if (levelBonus < 0.5) levelBonus = 0.5;
        if (levelBonus > 2.0) levelBonus = 2.0;

        double rawDamage = baseAtk * skillModifier * levelBonus + attackerLevel * 2;
        double mitigatedDamage = rawDamage - def * 0.2;
        return Math.Max(1, (int)Math.Round(mitigatedDamage));
    }

    public static bool CalculateHitChance(int attackerRate, int defenderRate)
    {
        double hitChance = (double)attackerRate / (attackerRate + defenderRate) * 85.0 + 15.0;
        if (hitChance > 95) hitChance = 95;
        if (hitChance < 20) hitChance = 20;
        return Random.Shared.NextDouble() * 100 < hitChance;
    }

    public static (int damage, bool isCrit, bool hit) HandlePlayerAttack(Player attacker, Monster target, int skillId)
    {
        if (target.IsDead) return (0, false, false);

        if (!GameData.Skills.TryGetValue(skillId, out var skill))
            skill = GameData.Skills[1];

        if (attacker.Level < skill.LevelReq) return (0, false, false);
        if (skill.ManaCost > 0 && attacker.MP < skill.ManaCost) return (0, false, false);

        bool hits = CalculateHitChance(attacker.AttackRate, target.DefenseRate);
        if (!hits) return (0, false, false);

        bool isCrit = CheckCrit(false);
        double critMod = isCrit ? 1.5 : 1.0;

        int damage;
        if (attacker.Class == "mago" && attacker.WizRaise > 0)
        {
            damage = CalculateMagicDamage(attacker.WizRaise, attacker.Level, target.Defense, target.Level, skill.DamageModifier);
        }
        else
        {
            damage = CalculateDamage(attacker.AttackMin, attacker.AttackMax, attacker.Level, target.Defense, target.Level, skill.DamageModifier);
        }
        damage = (int)(damage * critMod);

        if (skill.ManaCost > 0)
        {
            attacker.MP = Math.Max(0, attacker.MP - skill.ManaCost);
        }

        if (skill.Cooldown > 0)
        {
            attacker.SetCooldown(skillId, skill.Cooldown);
        }

        int dealt = target.TakeDamage(damage);
        attacker.InCombat = true;
        attacker.AttackTimer = 0.8;

        return (dealt, isCrit, true);
    }

    public static (int damage, bool hit) HandleMonsterAttack(Monster monster, Player target)
    {
        bool hits = CalculateHitChance(monster.AttackRate, target.DefenseRate);
        if (!hits) return (0, false);

        int damage = CalculateDamage(monster.AttackMin, monster.AttackMax, monster.Level, target.Defense, target.Level, 1.0);
        int dealt = target.TakeDamage(damage);
        return (dealt, true);
    }

    public static bool CheckCrit(bool hasLuck)
    {
        double chance = hasLuck ? 10.0 : 5.0;
        return Random.Shared.NextDouble() * 100 < chance;
    }

    public static long CalculateXpReward(int monsterLevel, int playerLevel, int baseXp)
    {
        int levelDiff = monsterLevel - playerLevel;
        double multiplier;
        if (levelDiff >= 10) multiplier = 2.0;
        else if (levelDiff >= 5) multiplier = 1.5;
        else if (levelDiff >= 0) multiplier = 1.0;
        else if (levelDiff >= -5) multiplier = 0.8;
        else if (levelDiff >= -10) multiplier = 0.5;
        else multiplier = 0.1;

        return (long)(baseXp * multiplier);
    }
}
