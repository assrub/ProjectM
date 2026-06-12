using System.Collections.Concurrent;
using MuServer.Data;

namespace MuServer.Game;

public class Player
{
    private static int _nextId = 1;
    private static readonly object _idLock = new();

    public string ConnectionId { get; set; } = "";
    public int Id { get; private set; }
    public string Name { get; set; } = "";
    public string Class { get; set; } = "dk";
    public int Level { get; set; } = 1;
    public long XP { get; set; }
    public long XpForNextLevel => Level * 100L + (Level - 1) * (Level - 1) * 50L;
    public int StatPoints { get; set; } = 5;
    public int Gold { get; set; } = 1000;

    public int Str { get; set; }
    public int Agi { get; set; }
    public int Vit { get; set; }
    public int Ene { get; set; }

    public int BaseStr { get; set; }
    public int BaseAgi { get; set; }
    public int BaseVit { get; set; }
    public int BaseEne { get; set; }

    public int HP { get; set; }
    public int MaxHP { get; set; }
    public int MP { get; set; }
    public int MaxMP { get; set; }

    public int AttackMin { get; set; }
    public int AttackMax { get; set; }
    public int WizRaise { get; set; }
    public int Defense { get; set; }
    public int AttackRate { get; set; }
    public int DefenseRate { get; set; }
    public int MoveSpeed { get; set; } = 3;

    public int MapId { get; set; } = 1;
    public int X { get; set; }
    public int Y { get; set; }

    public ConcurrentBag<int> Skills { get; set; } = new();
    public ConcurrentDictionary<int, long> Cooldowns { get; set; } = new();

    public List<ItemInstance> Inventory { get; set; } = new();
    public Dictionary<string, ItemInstance> Equipment { get; set; } = new()
    {
        ["head"] = null!, ["chest"] = null!, ["legs"] = null!,
        ["hands"] = null!, ["feet"] = null!, ["rightHand"] = null!,
        ["leftHand"] = null!, ["ring1"] = null!, ["ring2"] = null!,
        ["pendant"] = null!
    };

    public bool IsConnected { get; set; } = true;
    public double AttackTimer { get; set; }
    public bool InCombat { get; set; }
    public string? PartyId { get; set; }

    public Player()
    {
        lock (_idLock)
        {
            Id = _nextId++;
        }
    }

    public void InitFromClassData()
    {
        if (!GameData.Classes.TryGetValue(Class, out var classData))
            classData = GameData.Classes["dk"];

        BaseStr = classData.BaseStats.Str;
        BaseAgi = classData.BaseStats.Agi;
        BaseVit = classData.BaseStats.Vit;
        BaseEne = classData.BaseStats.Ene;

        Str = BaseStr;
        Agi = BaseAgi;
        Vit = BaseVit;
        Ene = BaseEne;

        MaxHP = 40 + Vit * 2 + Level * classData.HpPerLevel;
        MaxMP = 10 + Ene + Level * classData.MpPerLevel;
        HP = MaxHP;
        MP = MaxMP;

        foreach (var skillId in classData.Skills)
            Skills.Add(skillId);

        StatPoints = classData.PointsPerLevel;

        MapId = 1;
        X = 36;
        Y = 28;

        RecalcStats();
    }

    public void RecalcStats()
    {
        AttackMin = Str / 4 + (Level * 2) / 5;
        AttackMax = Str / 2 + (Level * 3) / 5;
        WizRaise = Ene / 4;
        Defense = Vit / 5 + Agi / 10;
        AttackRate = Str + Level * 5 + Agi * 3 / 2;
        DefenseRate = Agi + Level * 2 + Vit / 2;

        int hpBonus = 0, mpBonus = 0;
        bool hasWeapon = false;

        foreach (var kvp in Equipment)
        {
            var item = kvp.Value;
            if (item?.Definition == null) continue;

            var def = item.Definition;
            if (def.Type == "weapon" && (kvp.Key == "rightHand" || kvp.Key == "leftHand"))
            {
                if (def.AttackMin > 0 || def.AttackMax > 0)
                {
                    AttackMin += def.AttackMin + item.Level * 2;
                    AttackMax += def.AttackMax + item.Level * 3;
                    hasWeapon = true;
                }
                WizRaise += def.WizRaise + item.Level * 2;
            }
            else if (def.Type == "armor")
            {
                Defense += def.Defense + item.Level;
            }

            hpBonus += item.Level * 2;
            mpBonus += item.Level;
        }

        var classData = GameData.Classes.GetValueOrDefault(Class);
        MaxHP = 40 + Vit * 2 + (classData?.HpPerLevel ?? 10) * Level + hpBonus;
        MaxMP = 10 + Ene + (classData?.MpPerLevel ?? 5) * Level + mpBonus;

        if (HP > MaxHP) HP = MaxHP;
        if (MP > MaxMP) MP = MaxMP;
    }

    public int TakeDamage(int damage)
    {
        int actualDmg = Math.Max(1, damage - Defense / 2);
        HP = Math.Max(0, HP - actualDmg);
        return actualDmg;
    }

    public void Heal(int amount)
    {
        HP = Math.Min(MaxHP, HP + amount);
    }

    public void HealMp(int amount)
    {
        MP = Math.Min(MaxMP, MP + amount);
    }

    public void AddXp(long amount)
    {
        XP += amount;
        while (XP >= XpForNextLevel)
        {
            XP -= XpForNextLevel;
            LevelUp();
        }
    }

    private void LevelUp()
    {
        Level++;
        if (GameData.Classes.TryGetValue(Class, out var cd))
        {
            StatPoints += cd.PointsPerLevel;
            MaxHP += cd.HpPerLevel;
            MaxMP += cd.MpPerLevel;
        }
        else
        {
            StatPoints += 5;
            MaxHP += 10;
            MaxMP += 5;
        }
        HP = MaxHP;
        MP = MaxMP;
        RecalcStats();
    }

    public bool AddStat(string stat)
    {
        if (StatPoints <= 0) return false;

        switch (stat.ToLower())
        {
            case "str": Str++; break;
            case "agi": Agi++; break;
            case "vit": Vit++; break;
            case "ene": Ene++; break;
            default: return false;
        }
        StatPoints--;
        RecalcStats();
        return true;
    }

    public bool CanEquip(ItemDefinition itemDef)
    {
        if (itemDef.Class != "all" && itemDef.Class != Class) return false;
        if (Str < itemDef.ReqStr) return false;
        if (Agi < itemDef.ReqAgi) return false;
        if (Vit < itemDef.ReqVit) return false;
        if (Ene < itemDef.ReqEne) return false;
        return true;
    }

    public bool EquipItem(string itemId)
    {
        var item = Inventory.FirstOrDefault(i => i.Id == itemId && !i.Equipped);
        if (item?.Definition == null) return false;
        if (!CanEquip(item.Definition)) return false;

        string slot = item.Definition.Slot;

        if (Equipment.TryGetValue(slot, out var existing) && existing != null)
        {
            existing.Equipped = false;
            existing.Slot = Inventory.IndexOf(existing);
        }

        item.Equipped = true;
        item.Slot = Inventory.IndexOf(item);
        Equipment[slot] = item;

        RecalcStats();
        return true;
    }

    public bool UnequipItem(string slot)
    {
        if (!Equipment.TryGetValue(slot, out var item) || item == null) return false;

        if (Inventory.Count >= 60) return false;

        item.Equipped = false;
        item.Slot = Inventory.Count;
        Inventory.Add(item);
        Equipment[slot] = null!;

        RecalcStats();
        return true;
    }

    public bool AddItemToInventory(ItemInstance item)
    {
        if (Inventory.Count >= 60) return false;
        item.Equipped = false;
        item.Slot = Inventory.Count;
        item.OwnerId = Id.ToString();
        Inventory.Add(item);
        return true;
    }

    public bool RemoveItemFromInventory(string itemId)
    {
        var item = Inventory.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return false;
        Inventory.Remove(item);
        return true;
    }

    public long GetTotalAttack()
    {
        return Random.Shared.Next(AttackMin, AttackMax + 1);
    }

    public long GetTotalDefense()
    {
        return Defense;
    }

    public bool IsSkillOnCooldown(int skillId)
    {
        if (Cooldowns.TryGetValue(skillId, out var expires))
        {
            if (Environment.TickCount64 < expires) return true;
            Cooldowns.TryRemove(skillId, out _);
        }
        return false;
    }

    public void SetCooldown(int skillId, int cooldownMs)
    {
        Cooldowns[skillId] = Environment.TickCount64 + cooldownMs;
    }
}
