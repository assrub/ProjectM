using System.Text.Json;

namespace MuServer.Data;

public static class GameData
{
    public static Dictionary<string, PlayerClassData> Classes { get; private set; } = new();
    public static Dictionary<int, MonsterDefinition> Monsters { get; private set; } = new();
    public static Dictionary<int, ItemDefinition> Items { get; private set; } = new();
    public static Dictionary<int, SkillDefinition> Skills { get; private set; } = new();
    public static Dictionary<int, NpcDefinition> NPCs { get; private set; } = new();
    public static Dictionary<int, MapDefinition> Maps { get; private set; } = new();

    private static readonly string DataDir = Path.Combine(AppContext.BaseDirectory, "Data");

    public static void LoadAll()
    {
        LoadClasses();
        LoadMonsters();
        LoadItems();
        LoadSkills();
        LoadNPCs();
        LoadMaps();
    }

    private static void LoadClasses()
    {
        var path = Path.Combine(DataDir, "classes.json");
        if (!File.Exists(path)) { WriteDefaultClasses(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<PlayerClassData>>(json) ?? new();
        Classes = list.ToDictionary(c => c.Id, c => c);
    }

    private static void LoadMonsters()
    {
        var path = Path.Combine(DataDir, "monsters.json");
        if (!File.Exists(path)) { WriteDefaultMonsters(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<MonsterDefinition>>(json) ?? new();
        Monsters = list.ToDictionary(m => m.Id, m => m);
    }

    private static void LoadItems()
    {
        var path = Path.Combine(DataDir, "items.json");
        if (!File.Exists(path)) { WriteDefaultItems(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<ItemDefinition>>(json) ?? new();
        Items = list.ToDictionary(i => i.Id, i => i);
    }

    private static void LoadSkills()
    {
        var path = Path.Combine(DataDir, "skills.json");
        if (!File.Exists(path)) { WriteDefaultSkills(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<SkillDefinition>>(json) ?? new();
        Skills = list.ToDictionary(s => s.Id, s => s);
    }

    private static void LoadNPCs()
    {
        var path = Path.Combine(DataDir, "npcs.json");
        if (!File.Exists(path)) { WriteDefaultNPCs(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<NpcDefinition>>(json) ?? new();
        NPCs = list.ToDictionary(n => n.Id, n => n);
    }

    private static void LoadMaps()
    {
        var path = Path.Combine(DataDir, "maps.json");
        if (!File.Exists(path)) { WriteDefaultMaps(path); }
        var json = File.ReadAllText(path);
        var list = JsonSerializer.Deserialize<List<MapDefinition>>(json) ?? new();
        Maps = list.ToDictionary(m => m.Id, m => m);
    }

    private static void WriteDefaultClasses(string path)
    {
        var data = new List<PlayerClassData>
        {
            new()
            {
                Id = "dk", Name = "Dark Knight", PointsPerLevel = 5, HpPerLevel = 12, MpPerLevel = 4,
                BaseStats = new BaseStats { Str = 28, Agi = 20, Vit = 25, Ene = 10 },
                Skills = new List<int> { 1, 2, 3 }
            },
            new()
            {
                Id = "elf", Name = "Elf", PointsPerLevel = 5, HpPerLevel = 8, MpPerLevel = 6,
                BaseStats = new BaseStats { Str = 22, Agi = 28, Vit = 20, Ene = 13 },
                Skills = new List<int> { 1, 4, 5 }
            },
            new()
            {
                Id = "mago", Name = "Mago", PointsPerLevel = 5, HpPerLevel = 6, MpPerLevel = 10,
                BaseStats = new BaseStats { Str = 18, Agi = 18, Vit = 15, Ene = 32 },
                Skills = new List<int> { 1, 6, 7 }
            }
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteDefaultMonsters(string path)
    {
        var data = new List<MonsterDefinition>
        {
            new() { Id = 1, Name = "Spider", Level = 1, Hp = 30, AtkMin = 3, AtkMax = 6, Def = 1, AtkRate = 10, DefRate = 5, Xp = 4, AggroRange = 4, AttackRange = 1, MoveSpeed = 2, RespawnTime = 8, Drops = new(){ new(){ ItemDefId=1, Chance=0.3 }, new(){ ItemDefId=2, Chance=0.1 } } },
            new() { Id = 2, Name = "Wolf", Level = 3, Hp = 60, AtkMin = 6, AtkMax = 11, Def = 3, AtkRate = 15, DefRate = 8, Xp = 10, AggroRange = 5, AttackRange = 1, MoveSpeed = 3, RespawnTime = 10, Drops = new(){ new(){ ItemDefId=1, Chance=0.4 }, new(){ ItemDefId=3, Chance=0.15 } } },
            new() { Id = 3, Name = "Goblin", Level = 5, Hp = 100, AtkMin = 10, AtkMax = 18, Def = 5, AtkRate = 20, DefRate = 12, Xp = 20, AggroRange = 5, AttackRange = 1, MoveSpeed = 2, RespawnTime = 12, Drops = new(){ new(){ ItemDefId=2, Chance=0.3 }, new(){ ItemDefId=4, Chance=0.1 } } },
            new() { Id = 4, Name = "Skeleton", Level = 8, Hp = 180, AtkMin = 16, AtkMax = 28, Def = 8, AtkRate = 28, DefRate = 18, Xp = 40, AggroRange = 6, AttackRange = 1, MoveSpeed = 2, RespawnTime = 15, Drops = new(){ new(){ ItemDefId=3, Chance=0.25 }, new(){ ItemDefId=5, Chance=0.08 } } },
            new() { Id = 5, Name = "Elite Skeleton", Level = 12, Hp = 350, AtkMin = 25, AtkMax = 42, Def = 14, AtkRate = 40, DefRate = 25, Xp = 80, AggroRange = 6, AttackRange = 1, MoveSpeed = 3, RespawnTime = 20, Drops = new(){ new(){ ItemDefId=4, Chance=0.2 }, new(){ ItemDefId=6, Chance=0.05 } } },
            new() { Id = 6, Name = "Golem", Level = 16, Hp = 600, AtkMin = 35, AtkMax = 55, Def = 20, AtkRate = 50, DefRate = 35, Xp = 150, AggroRange = 7, AttackRange = 2, MoveSpeed = 1, RespawnTime = 25, Drops = new(){ new(){ ItemDefId=5, Chance=0.3 }, new(){ ItemDefId=7, Chance=0.04 } } },
            new() { Id = 7, Name = "Elite Golem", Level = 20, Hp = 1000, AtkMin = 50, AtkMax = 80, Def = 30, AtkRate = 65, DefRate = 45, Xp = 280, AggroRange = 7, AttackRange = 2, MoveSpeed = 2, RespawnTime = 30, Drops = new(){ new(){ ItemDefId=6, Chance=0.25 }, new(){ ItemDefId=8, Chance=0.03 } } },
            new() { Id = 8, Name = "Death Knight", Level = 25, Hp = 1800, AtkMin = 70, AtkMax = 110, Def = 40, AtkRate = 80, DefRate = 55, Xp = 500, AggroRange = 8, AttackRange = 1, MoveSpeed = 3, RespawnTime = 30, Drops = new(){ new(){ ItemDefId=7, Chance=0.2 }, new(){ ItemDefId=9, Chance=0.02 } } }
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteDefaultItems(string path)
    {
        var data = new List<ItemDefinition>
        {
            new() { Id = 1, Name = "Small HP Potion", Type = "potion", Class = "all", Slot = "consumable", Level = 0, ReqStr = 0, ReqAgi = 0, ReqVit = 0, ReqEne = 0, Value = 10, Icon = 1, HealHp = 50 },
            new() { Id = 2, Name = "Medium HP Potion", Type = "potion", Class = "all", Slot = "consumable", Level = 0, ReqStr = 0, ReqAgi = 0, ReqVit = 0, ReqEne = 0, Value = 30, Icon = 2, HealHp = 150 },
            new() { Id = 3, Name = "Small MP Potion", Type = "potion", Class = "all", Slot = "consumable", Level = 0, ReqStr = 0, ReqAgi = 0, ReqVit = 0, ReqEne = 0, Value = 10, Icon = 3, HealMp = 40 },
            new() { Id = 4, Name = "Short Sword", Type = "weapon", Class = "dk", Slot = "rightHand", Level = 1, AttackMin = 4, AttackMax = 8, Speed = 20, ReqStr = 15, ReqAgi = 10, Value = 50, Icon = 10 },
            new() { Id = 5, Name = "Long Sword", Type = "weapon", Class = "dk", Slot = "rightHand", Level = 3, AttackMin = 8, AttackMax = 14, Speed = 25, ReqStr = 25, ReqAgi = 15, Value = 150, Icon = 11 },
            new() { Id = 6, Name = "Blade", Type = "weapon", Class = "dk", Slot = "rightHand", Level = 6, AttackMin = 14, AttackMax = 22, Speed = 30, ReqStr = 40, ReqAgi = 25, Value = 400, Icon = 12 },
            new() { Id = 7, Name = "Bow", Type = "weapon", Class = "elf", Slot = "rightHand", Level = 1, AttackMin = 3, AttackMax = 7, Speed = 25, ReqStr = 10, ReqAgi = 20, Value = 50, Icon = 13 },
            new() { Id = 8, Name = "Crossbow", Type = "weapon", Class = "elf", Slot = "rightHand", Level = 3, AttackMin = 7, AttackMax = 13, Speed = 30, ReqStr = 15, ReqAgi = 35, Value = 150, Icon = 14 },
            new() { Id = 9, Name = "Staff", Type = "weapon", Class = "mago", Slot = "rightHand", Level = 1, AttackMin = 3, AttackMax = 6, WizRaise = 5, Speed = 15, ReqStr = 10, ReqEne = 25, Value = 60, Icon = 15 },
            new() { Id = 10, Name = "Skull Staff", Type = "weapon", Class = "mago", Slot = "rightHand", Level = 3, AttackMin = 6, AttackMax = 11, WizRaise = 10, Speed = 15, ReqStr = 15, ReqEne = 45, Value = 180, Icon = 16 },
            new() { Id = 11, Name = "Plate Helmet", Type = "armor", Class = "dk", Slot = "head", Level = 2, Defense = 3, ReqStr = 20, ReqAgi = 10, Value = 80, Icon = 20 },
            new() { Id = 12, Name = "Plate Armor", Type = "armor", Class = "dk", Slot = "chest", Level = 2, Defense = 6, ReqStr = 25, ReqAgi = 10, Value = 200, Icon = 21 },
            new() { Id = 13, Name = "Plate Pants", Type = "armor", Class = "dk", Slot = "legs", Level = 2, Defense = 4, ReqStr = 22, ReqAgi = 10, Value = 120, Icon = 22 },
            new() { Id = 14, Name = "Plate Gloves", Type = "armor", Class = "dk", Slot = "hands", Level = 2, Defense = 2, ReqStr = 18, ReqAgi = 10, Value = 60, Icon = 23 },
            new() { Id = 15, Name = "Plate Boots", Type = "armor", Class = "dk", Slot = "feet", Level = 2, Defense = 2, ReqStr = 18, ReqAgi = 10, Value = 60, Icon = 24 },
            new() { Id = 16, Name = "Leather Helmet", Type = "armor", Class = "elf", Slot = "head", Level = 1, Defense = 2, ReqStr = 10, ReqAgi = 20, Value = 50, Icon = 25 },
            new() { Id = 17, Name = "Leather Armor", Type = "armor", Class = "elf", Slot = "chest", Level = 1, Defense = 4, ReqStr = 12, ReqAgi = 25, Value = 120, Icon = 26 },
            new() { Id = 18, Name = "Pad Helmet", Type = "armor", Class = "mago", Slot = "head", Level = 1, Defense = 1, ReqStr = 8, ReqEne = 20, Value = 40, Icon = 27 },
            new() { Id = 19, Name = "Pad Armor", Type = "armor", Class = "mago", Slot = "chest", Level = 1, Defense = 3, ReqStr = 10, ReqEne = 30, Value = 100, Icon = 28 },
            new() { Id = 20, Name = "Jewel of Bless", Type = "jewel", Class = "all", Slot = "jewel", Level = 0, Value = 10000, Icon = 30 },
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteDefaultSkills(string path)
    {
        var data = new List<SkillDefinition>
        {
            new() { Id = 1, Name = "Normal Attack", Class = "all", LevelReq = 0, ManaCost = 0, AgCost = 0, Cooldown = 0, DamageModifier = 1.0, Range = 1, AreaOfEffect = 0, Description = "Basic melee attack" },
            new() { Id = 2, Name = "Slash", Class = "dk", LevelReq = 3, ManaCost = 5, AgCost = 0, Cooldown = 2000, DamageModifier = 1.5, Range = 1, AreaOfEffect = 0, Description = "Powerful slash" },
            new() { Id = 3, Name = "Whirlwind", Class = "dk", LevelReq = 10, ManaCost = 15, AgCost = 0, Cooldown = 5000, DamageModifier = 1.2, Range = 1, AreaOfEffect = 2, Description = "Area attack around player" },
            new() { Id = 4, Name = "Arrow Shot", Class = "elf", LevelReq = 3, ManaCost = 5, AgCost = 0, Cooldown = 1500, DamageModifier = 1.4, Range = 4, AreaOfEffect = 0, Description = "Ranged arrow attack" },
            new() { Id = 5, Name = "Multi Shot", Class = "elf", LevelReq = 10, ManaCost = 12, AgCost = 0, Cooldown = 4000, DamageModifier = 1.1, Range = 4, AreaOfEffect = 2, Description = "Attack multiple enemies" },
            new() { Id = 6, Name = "Fire Ball", Class = "mago", LevelReq = 3, ManaCost = 10, AgCost = 0, Cooldown = 2000, DamageModifier = 1.6, Range = 5, AreaOfEffect = 0, Description = "Fire magic projectile" },
            new() { Id = 7, Name = "Meteor Strike", Class = "mago", LevelReq = 10, ManaCost = 25, AgCost = 0, Cooldown = 5000, DamageModifier = 2.0, Range = 5, AreaOfEffect = 2, Description = "Massive area magic attack" },
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteDefaultNPCs(string path)
    {
        var data = new List<NpcDefinition>
        {
            new() { Id = 1, Name = "Potion Girl", MapId = 1, X = 80, Y = 100, ShopItems = new() { 1, 2, 3 } },
            new() { Id = 2, Name = "Weapon Merchant", MapId = 1, X = 82, Y = 98, ShopItems = new() { 4, 5, 7, 9 } },
            new() { Id = 3, Name = "Armor Merchant", MapId = 1, X = 84, Y = 96, ShopItems = new() { 11, 12, 13, 14, 15 } },
            new() { Id = 4, Name = "Potion Girl Elf", MapId = 2, X = 120, Y = 80, ShopItems = new() { 1, 2, 3 } },
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static void WriteDefaultMaps(string path)
    {
        var data = new List<MapDefinition>
        {
            new()
            {
                Id = 1, Name = "Lorencia", Width = 256, Height = 256,
                SpawnPoints = new()
                {
                    new() { MonsterDefId = 1, X = 120, Y = 150, Count = 8 },
                    new() { MonsterDefId = 2, X = 140, Y = 130, Count = 6 },
                    new() { MonsterDefId = 3, X = 160, Y = 110, Count = 4 },
                },
                Npcs = new() { 1, 2, 3 },
                Connections = new() { new() { MapId = 2, X = 0, Y = 0 } }
            },
            new()
            {
                Id = 2, Name = "Noria", Width = 256, Height = 256,
                SpawnPoints = new()
                {
                    new() { MonsterDefId = 3, X = 100, Y = 170, Count = 6 },
                    new() { MonsterDefId = 4, X = 120, Y = 150, Count = 5 },
                    new() { MonsterDefId = 5, X = 140, Y = 130, Count = 3 },
                    new() { MonsterDefId = 6, X = 160, Y = 110, Count = 2 },
                },
                Npcs = new() { 4 },
                Connections = new() { new() { MapId = 1, X = 0, Y = 0 } }
            },
            new()
            {
                Id = 3, Name = "Dungeon", Width = 256, Height = 256,
                SpawnPoints = new()
                {
                    new() { MonsterDefId = 4, X = 80, Y = 80, Count = 8 },
                    new() { MonsterDefId = 5, X = 100, Y = 100, Count = 5 },
                    new() { MonsterDefId = 6, X = 120, Y = 120, Count = 4 },
                    new() { MonsterDefId = 7, X = 140, Y = 140, Count = 3 },
                    new() { MonsterDefId = 8, X = 160, Y = 160, Count = 2 },
                },
                Npcs = new(),
                Connections = new() { new() { MapId = 1, X = 0, Y = 0 } }
            }
        };
        File.WriteAllText(path, JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true }));
    }
}
