using MuServer.Data;

namespace MuServer.Game;

public class LootSystem
{
    private readonly List<ItemInstance> _droppedItems = new();
    private readonly object _dropLock = new();
    private int _nextDropId = 1;

    public List<ItemInstance> GenerateDrop(MonsterDefinition? monsterDef, int mapId, int x, int y)
    {
        var drops = new List<ItemInstance>();

        if (monsterDef == null) return drops;

        lock (_dropLock)
        {
            foreach (var dropEntry in monsterDef.Drops)
            {
                if (!GameData.Items.TryGetValue(dropEntry.ItemDefId, out var itemDef))
                    continue;

                if (Random.Shared.NextDouble() * 100 < dropEntry.Chance)
                {
                    int itemLevel = dropEntry.MinLevel;
                    if (dropEntry.MaxLevel > dropEntry.MinLevel)
                        itemLevel = Random.Shared.Next(dropEntry.MinLevel, dropEntry.MaxLevel + 1);

                    var item = new ItemInstance
                    {
                        Id = $"drop_{_nextDropId++}_{Environment.TickCount64}",
                        ItemDefId = dropEntry.ItemDefId,
                        Definition = itemDef,
                        Luck = itemDef.Luck && Random.Shared.NextDouble() < 0.05,
                        Level = itemLevel,
                        Dropped = true,
                        DropTime = Environment.TickCount64,
                        X = x,
                        Y = y,
                        MapId = mapId
                    };
                    drops.Add(item);
                    _droppedItems.Add(item);
                }
            }

            int goldDrop = monsterDef.Level * Random.Shared.Next(1, 5) * 5;
            if (goldDrop > 0)
            {
                var goldItem = new ItemInstance
                {
                    Id = $"gold_{_nextDropId++}_{Environment.TickCount64}",
                    ItemDefId = -1,
                    Definition = null,
                    Dropped = true,
                    DropTime = Environment.TickCount64,
                    X = x,
                    Y = y,
                    MapId = mapId,
                    Level = goldDrop
                };
                drops.Add(goldItem);
                _droppedItems.Add(goldItem);
            }
        }

        return drops;
    }

    public void RemoveExpiredDrops()
    {
        long now = Environment.TickCount64;
        const long dropLifetimeMs = 60_000;

        lock (_dropLock)
        {
            _droppedItems.RemoveAll(d => d.Dropped && (now - d.DropTime) > dropLifetimeMs);
        }
    }

    public ItemInstance? PickupItem(string itemId)
    {
        lock (_dropLock)
        {
            var item = _droppedItems.FirstOrDefault(d => d.Id == itemId && d.Dropped);
            if (item != null)
            {
                _droppedItems.Remove(item);
                item.Dropped = false;
            }
            return item;
        }
    }

    public List<ItemInstance> GetDroppedItemsOnMap(int mapId)
    {
        lock (_dropLock)
        {
            return _droppedItems.Where(d => d.MapId == mapId && d.Dropped).ToList();
        }
    }

    public List<ItemInstance> GetDroppedItemsInRange(int mapId, int x, int y, int range)
    {
        lock (_dropLock)
        {
            return _droppedItems
                .Where(d => d.MapId == mapId && d.Dropped &&
                    Math.Abs(d.X - x) <= range && Math.Abs(d.Y - y) <= range)
                .ToList();
        }
    }

    public void RemoveDrop(string itemId)
    {
        lock (_dropLock)
        {
            _droppedItems.RemoveAll(d => d.Id == itemId);
        }
    }

    public void AddDroppedItem(ItemInstance item)
    {
        lock (_dropLock)
        {
            if (!item.Dropped)
            {
                item.Dropped = true;
                item.DropTime = Environment.TickCount64;
            }
            _droppedItems.Add(item);
        }
    }
}
