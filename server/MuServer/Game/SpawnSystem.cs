using MuServer.Data;

namespace MuServer.Game;

public class SpawnSystem
{
    private readonly World _world;
    private readonly List<Monster> _allMonsters = new();
    private readonly object _monsterLock = new();

    public IReadOnlyList<Monster> AllMonsters => _allMonsters.AsReadOnly();

    public SpawnSystem(World world)
    {
        _world = world;
    }

    public void SpawnAll()
    {
        lock (_monsterLock)
        {
            _allMonsters.Clear();

            foreach (var mapKvp in GameData.Maps)
            {
                var map = mapKvp.Value;
                foreach (var spawn in map.SpawnPoints)
                {
                    if (!GameData.Monsters.TryGetValue(spawn.MonsterDefId, out var monDef))
                        continue;

                    for (int i = 0; i < spawn.Count; i++)
                    {
                        var monster = new Monster();
                        monster.InitFromDefinition(monDef);
                        monster.MapId = map.Id;
                        monster.OriginalX = spawn.X + Random.Shared.Next(-3, 4);
                        monster.OriginalY = spawn.Y + Random.Shared.Next(-3, 4);
                        monster.X = monster.OriginalX;
                        monster.Y = monster.OriginalY;
                        _allMonsters.Add(monster);
                    }
                }
            }
        }
    }

    public List<Monster> GetMonstersOnMap(int mapId)
    {
        lock (_monsterLock)
        {
            return _allMonsters.Where(m => m.MapId == mapId).ToList();
        }
    }

    public Monster? GetMonsterByEntityId(int entityId)
    {
        lock (_monsterLock)
        {
            return _allMonsters.FirstOrDefault(m => m.EntityId == entityId);
        }
    }

    public List<Monster> GetMonstersInRange(int mapId, int x, int y, int range)
    {
        lock (_monsterLock)
        {
            return _allMonsters
                .Where(m => m.MapId == mapId && !m.IsDead &&
                    Math.Abs(m.X - x) <= range && Math.Abs(m.Y - y) <= range)
                .ToList();
        }
    }

    public void ProcessRespawns(double deltaTime)
    {
        lock (_monsterLock)
        {
            foreach (var monster in _allMonsters)
            {
                if (monster.IsDead)
                {
                    monster.RespawnTimer -= deltaTime;
                    if (monster.RespawnTimer <= 0)
                    {
                        monster.Reset();
                    }
                }
            }
        }
    }

    public void UpdateAI(double deltaTime, Dictionary<string, Player> players)
    {
        List<Monster> snapshot;
        lock (_monsterLock)
        {
            snapshot = _allMonsters.Where(m => !m.IsDead).ToList();
        }

        foreach (var monster in snapshot)
        {
            monster.UpdateAI(deltaTime, players);
        }
    }

    public void RespawnSpecific(Monster monster)
    {
        monster.RespawnTimer = monster.RespawnTime;
        monster.IsDead = true;
        monster.State = "Dead";
    }
}
