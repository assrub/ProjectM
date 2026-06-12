using System.Text.Json.Serialization;

namespace MuServer.Data;

public class PlayerClassData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("baseStats")]
    public BaseStats BaseStats { get; set; } = new();

    [JsonPropertyName("pointsPerLevel")]
    public int PointsPerLevel { get; set; } = 5;

    [JsonPropertyName("hpPerLevel")]
    public int HpPerLevel { get; set; } = 10;

    [JsonPropertyName("mpPerLevel")]
    public int MpPerLevel { get; set; } = 5;

    [JsonPropertyName("skills")]
    public List<int> Skills { get; set; } = new();
}

public class BaseStats
{
    [JsonPropertyName("str")]
    public int Str { get; set; }

    [JsonPropertyName("agi")]
    public int Agi { get; set; }

    [JsonPropertyName("vit")]
    public int Vit { get; set; }

    [JsonPropertyName("ene")]
    public int Ene { get; set; }
}

public class MonsterDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("level")]
    public int Level { get; set; }

    [JsonPropertyName("hp")]
    public int Hp { get; set; }

    [JsonPropertyName("atkMin")]
    public int AtkMin { get; set; }

    [JsonPropertyName("atkMax")]
    public int AtkMax { get; set; }

    [JsonPropertyName("def")]
    public int Def { get; set; }

    [JsonPropertyName("atkRate")]
    public int AtkRate { get; set; }

    [JsonPropertyName("defRate")]
    public int DefRate { get; set; }

    [JsonPropertyName("xp")]
    public int Xp { get; set; }

    [JsonPropertyName("aggroRange")]
    public int AggroRange { get; set; } = 5;

    [JsonPropertyName("attackRange")]
    public int AttackRange { get; set; } = 1;

    [JsonPropertyName("moveSpeed")]
    public int MoveSpeed { get; set; } = 3;

    [JsonPropertyName("respawnTime")]
    public int RespawnTime { get; set; } = 15;

    [JsonPropertyName("drops")]
    public List<DropEntry> Drops { get; set; } = new();
}

public class DropEntry
{
    [JsonPropertyName("itemDefId")]
    public int ItemDefId { get; set; }

    [JsonPropertyName("chance")]
    public double Chance { get; set; }

    [JsonPropertyName("minLevel")]
    public int MinLevel { get; set; }

    [JsonPropertyName("maxLevel")]
    public int MaxLevel { get; set; }
}

public class ItemDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("class")]
    public string Class { get; set; } = "";

    [JsonPropertyName("slot")]
    public string Slot { get; set; } = "";

    [JsonPropertyName("level")]
    public int Level { get; set; }

    [JsonPropertyName("reqStr")]
    public int ReqStr { get; set; }

    [JsonPropertyName("reqAgi")]
    public int ReqAgi { get; set; }

    [JsonPropertyName("reqVit")]
    public int ReqVit { get; set; }

    [JsonPropertyName("reqEne")]
    public int ReqEne { get; set; }

    [JsonPropertyName("attackMin")]
    public int AttackMin { get; set; }

    [JsonPropertyName("attackMax")]
    public int AttackMax { get; set; }

    [JsonPropertyName("defense")]
    public int Defense { get; set; }

    [JsonPropertyName("wizRaise")]
    public int WizRaise { get; set; }

    [JsonPropertyName("speed")]
    public int Speed { get; set; }

    [JsonPropertyName("luck")]
    public bool Luck { get; set; }

    [JsonPropertyName("value")]
    public int Value { get; set; }

    [JsonPropertyName("icon")]
    public int Icon { get; set; }

    [JsonPropertyName("healHp")]
    public int HealHp { get; set; }

    [JsonPropertyName("healMp")]
    public int HealMp { get; set; }
}

public class SkillDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("class")]
    public string Class { get; set; } = "";

    [JsonPropertyName("levelReq")]
    public int LevelReq { get; set; }

    [JsonPropertyName("manaCost")]
    public int ManaCost { get; set; }

    [JsonPropertyName("agCost")]
    public int AgCost { get; set; }

    [JsonPropertyName("cooldown")]
    public int Cooldown { get; set; }

    [JsonPropertyName("damageModifier")]
    public double DamageModifier { get; set; } = 1.0;

    [JsonPropertyName("range")]
    public int Range { get; set; } = 1;

    [JsonPropertyName("areaOfEffect")]
    public int AreaOfEffect { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
}

public class NpcDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("mapId")]
    public int MapId { get; set; }

    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public int Y { get; set; }

    [JsonPropertyName("shopItems")]
    public List<int> ShopItems { get; set; } = new();
}

public class MapDefinition
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("width")]
    public int Width { get; set; } = 256;

    [JsonPropertyName("height")]
    public int Height { get; set; } = 256;

    [JsonPropertyName("spawnPoints")]
    public List<SpawnPoint> SpawnPoints { get; set; } = new();

    [JsonPropertyName("npcs")]
    public List<int> Npcs { get; set; } = new();

    [JsonPropertyName("connections")]
    public List<MapConnection> Connections { get; set; } = new();
}

public class SpawnPoint
{
    [JsonPropertyName("monsterDefId")]
    public int MonsterDefId { get; set; }

    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public int Y { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; } = 1;
}

public class MapConnection
{
    [JsonPropertyName("mapId")]
    public int MapId { get; set; }

    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public int Y { get; set; }
}

public class ItemInstance
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("itemDefId")]
    public int ItemDefId { get; set; }

    [JsonPropertyName("ownerId")]
    public string? OwnerId { get; set; }

    [JsonPropertyName("equipped")]
    public bool Equipped { get; set; }

    [JsonPropertyName("slot")]
    public int Slot { get; set; }

    [JsonPropertyName("luck")]
    public bool Luck { get; set; }

    [JsonPropertyName("level")]
    public int Level { get; set; }

    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public int Y { get; set; }

    [JsonPropertyName("dropped")]
    public bool Dropped { get; set; }

    [JsonPropertyName("dropTime")]
    public long DropTime { get; set; }

    [JsonPropertyName("mapId")]
    public int MapId { get; set; }

    [JsonIgnore]
    public ItemDefinition? Definition { get; set; }
}

public class MonsterState
{
    public int EntityId { get; set; }

    [JsonPropertyName("definitionId")]
    public int DefinitionId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("level")]
    public int Level { get; set; }

    [JsonPropertyName("hp")]
    public int Hp { get; set; }

    [JsonPropertyName("maxHp")]
    public int MaxHp { get; set; }

    [JsonPropertyName("mapId")]
    public int MapId { get; set; }

    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public int Y { get; set; }

    [JsonPropertyName("state")]
    public string State { get; set; } = "Idle";

    [JsonPropertyName("attackMin")]
    public int AttackMin { get; set; }

    [JsonPropertyName("attackMax")]
    public int AttackMax { get; set; }

    [JsonPropertyName("defense")]
    public int Defense { get; set; }

    [JsonPropertyName("attackRate")]
    public int AttackRate { get; set; }

    [JsonPropertyName("defenseRate")]
    public int DefenseRate { get; set; }

    [JsonPropertyName("xpReward")]
    public int XpReward { get; set; }

    [JsonIgnore]
    public MonsterDefinition? Definition { get; set; }

    [JsonIgnore]
    public string? TargetPlayerId { get; set; }

    [JsonIgnore]
    public int RespawnTime { get; set; }

    [JsonIgnore]
    public double RespawnTimer { get; set; }

    [JsonIgnore]
    public bool IsDead { get; set; }

    [JsonIgnore]
    public int OriginalX { get; set; }

    [JsonIgnore]
    public int OriginalY { get; set; }

    [JsonIgnore]
    public double MoveTimer { get; set; }

    [JsonIgnore]
    public double AttackTimer { get; set; }
}
