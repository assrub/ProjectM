using System.Collections.Concurrent;
using MuServer.Data;
using MuServer.Networking;

namespace MuServer.Game;

public class World
{
    private readonly ConcurrentDictionary<string, Player> _players = new();
    private readonly SpawnSystem _spawnSystem;
    private readonly LootSystem _lootSystem;
    private WebSocketHandler _webSocketHandler = null!;
    private readonly string _saveFilePath;

    private double _gameTime;
    private double _saveTimer;
    private bool _running;

    public IReadOnlyDictionary<string, Player> Players => _players;
    public SpawnSystem Spawn => _spawnSystem;
    public LootSystem Loot => _lootSystem;

    public World()
    {
        _spawnSystem = new SpawnSystem(this);
        _lootSystem = new LootSystem();
        _saveFilePath = Path.Combine(AppContext.BaseDirectory, "save.json");
    }

    public void SetWebSocketHandler(WebSocketHandler handler)
    {
        _webSocketHandler = handler;
    }

    public void Start()
    {
        GameData.LoadAll();
        _spawnSystem.SpawnAll();
        LoadPlayers();

        _running = true;
        _ = GameLoopAsync();
    }

    public void Stop()
    {
        _running = false;
        SavePlayers();
    }

    private async Task GameLoopAsync()
    {
        const double tickRate = 0.05;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        double accumulator = 0;

        while (_running)
        {
            double frameTime = stopwatch.Elapsed.TotalSeconds - _gameTime;
            _gameTime = stopwatch.Elapsed.TotalSeconds;

            if (frameTime > 0.1) frameTime = 0.05;

            accumulator += frameTime;

            while (accumulator >= tickRate)
            {
                Update(tickRate);
                accumulator -= tickRate;
            }

            await Task.Delay((int)(tickRate * 1000));
        }
    }

    private void Update(double deltaTime)
    {
        _spawnSystem.UpdateAI(deltaTime, new Dictionary<string, Player>(_players));
        _spawnSystem.ProcessRespawns(deltaTime);

        ProcessMonsterAttacks(deltaTime);
        ProcessPlayerAttacks(deltaTime);
        _lootSystem.RemoveExpiredDrops();

        _saveTimer += deltaTime;
        if (_saveTimer >= 30.0)
        {
            _saveTimer = 0;
            SavePlayers();
        }

        BroadcastWorldState();
    }

    private void ProcessMonsterAttacks(double deltaTime)
    {
        var monsters = _spawnSystem.AllMonsters;
        foreach (var monster in monsters)
        {
            if (monster.IsDead || monster.State != "Attack" || monster.TargetPlayerId == null)
                continue;

            monster.AttackTimer -= deltaTime;
            if (monster.AttackTimer > 0) continue;
            monster.AttackTimer = 1.0;

            if (!_players.TryGetValue(monster.TargetPlayerId, out var target) || !target.IsConnected)
                continue;

            var (damage, hit) = CombatEngine.HandleMonsterAttack(monster, target);
            if (hit)
            {
                _ = _webSocketHandler.SendToPlayer(target.ConnectionId, new
                {
                    type = Protocol.DamageDealt,
                    targetId = target.Id,
                    targetType = "player",
                    damage,
                    attackerId = monster.EntityId,
                    attackerName = monster.Name
                });

                if (target.HP <= 0)
                {
                    target.HP = target.MaxHP / 2;
                    target.X = 100;
                    target.Y = 100;

                    _ = _webSocketHandler.SendToPlayer(target.ConnectionId, new
                    {
                        type = Protocol.Message,
                        text = "You have been defeated!",
                        category = "death"
                    });

                    _ = BroadcastPlayerPosition(target);
                }
            }
        }
    }

    private void ProcessPlayerAttacks(double deltaTime)
    {
        foreach (var kvp in _players)
        {
            var player = kvp.Value;
            if (!player.IsConnected) continue;

            player.AttackTimer = Math.Max(0, player.AttackTimer - deltaTime);
            if (player.InCombat && player.AttackTimer <= 0)
                player.InCombat = false;
        }
    }

    private void BroadcastWorldState()
    {
        var snapshot = new
        {
            type = Protocol.WorldState,
            players = _players.Values
                .Where(p => p.IsConnected)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    className = p.Class,
                    level = p.Level,
                    hp = p.HP,
                    maxHp = p.MaxHP,
                    mp = p.MP,
                    maxMp = p.MaxMP,
                    mapId = p.MapId,
                    x = p.X,
                    y = p.Y
                }),
            monsters = _spawnSystem.AllMonsters
                .Where(m => !m.IsDead)
                .Select(m => new
                {
                    entityId = m.EntityId,
                    definitionId = m.DefinitionId,
                    name = m.Name,
                    level = m.Level,
                    hp = m.HP,
                    maxHp = m.MaxHP,
                    mapId = m.MapId,
                    x = m.X,
                    y = m.Y,
                    state = m.State
                }),
            droppedItems = _lootSystem.GetDroppedItemsOnMap(1)
                .Concat(_lootSystem.GetDroppedItemsOnMap(2))
                .Concat(_lootSystem.GetDroppedItemsOnMap(3))
                .Select(d => new
                {
                    id = d.Id,
                    itemDefId = d.ItemDefId,
                    mapId = d.MapId,
                    x = d.X,
                    y = d.Y,
                    isGold = d.ItemDefId == -1,
                    goldAmount = d.ItemDefId == -1 ? d.Level : 0
                })
        };

        _ = _webSocketHandler.Broadcast(snapshot);
    }

    public Player? GetPlayerByConnectionId(string connectionId)
    {
        _players.TryGetValue(connectionId, out var player);
        return player;
    }

    public Player? GetPlayerById(int id)
    {
        return _players.Values.FirstOrDefault(p => p.Id == id);
    }

    public Player CreatePlayer(string connectionId, string name, string className)
    {
        var player = new Player
        {
            ConnectionId = connectionId,
            Name = name,
            Class = className
        };
        player.InitFromClassData();

        if (!string.IsNullOrEmpty(name) && _players.Values.Any(p => p.Name == name && p.ConnectionId != connectionId))
        {
            player.Name = name + Random.Shared.Next(100, 999);
        }

        _players[connectionId] = player;
        return player;
    }

    public void RemovePlayer(string connectionId)
    {
        if (_players.TryRemove(connectionId, out var player))
        {
            player.IsConnected = false;
            BroadcasterPlayerLeft(player);
        }
    }

    public void HandlePlayerMove(string connectionId, int mapId, int x, int y)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        player.MapId = mapId;
        player.X = x;
        player.Y = y;

        _ = BroadcastPlayerPosition(player);
    }

    public async Task BroadcastPlayerPosition(Player player)
    {
        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.PlayerPosition,
            id = player.Id,
            name = player.Name,
            mapId = player.MapId,
            x = player.X,
            y = player.Y
        });
    }

    public void BroadcasterPlayerLeft(Player player)
    {
        _ = _webSocketHandler.Broadcast(new
        {
            type = Protocol.PlayerLeft,
            id = player.Id,
            name = player.Name
        });
    }

    public async Task HandlePlayerAttack(string connectionId, int monsterEntityId, int skillId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        var monster = _spawnSystem.GetMonsterByEntityId(monsterEntityId);
        if (monster == null || monster.IsDead) return;

        if (player.IsSkillOnCooldown(skillId))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Skill is on cooldown"
            });
            return;
        }

        var (damage, isCrit, hit) = CombatEngine.HandlePlayerAttack(player, monster, skillId);
        if (!hit)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.DamageDealt,
                targetId = monster.EntityId,
                targetType = "monster",
                damage = 0,
                hit = false,
                miss = true
            });
            return;
        }

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.DamageDealt,
            attackerId = player.Id,
            attackerName = player.Name,
            targetId = monster.EntityId,
            targetType = "monster",
            damage,
            isCrit,
            hit = true
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.XpGained,
            amount = 0,
            monsterLevel = monster.Level
        });

        if (monster.HP <= 0)
        {
            await HandleMonsterDeath(monster, player);
        }
    }

    private async Task HandleMonsterDeath(Monster monster, Player killer)
    {
        monster.Die();

        long xpReward = CombatEngine.CalculateXpReward(monster.Level, killer.Level, monster.XpReward);
        killer.AddXp(xpReward);

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.MonsterDied,
            entityId = monster.EntityId,
            mapId = monster.MapId,
            killerId = killer.Id
        });

        await _webSocketHandler.SendToPlayer(killer.ConnectionId, new
        {
            type = Protocol.XpGained,
            amount = xpReward,
            monsterLevel = monster.Level
        });

        if (xpReward > 0)
        {
            long xpForNext = killer.XpForNextLevel;
            await _webSocketHandler.SendToPlayer(killer.ConnectionId, new
            {
                type = Protocol.StatUpdate,
                xp = killer.XP,
                xpForNext,
                level = killer.Level,
                statPoints = killer.StatPoints,
                hp = killer.HP,
                maxHp = killer.MaxHP,
                mp = killer.MP,
                maxMp = killer.MaxMP
            });
        }

        var drops = _lootSystem.GenerateDrop(monster.Definition, monster.MapId, monster.X, monster.Y);
        foreach (var drop in drops)
        {
            await _webSocketHandler.Broadcast(new
            {
                type = Protocol.ItemDropped,
                id = drop.Id,
                itemDefId = drop.ItemDefId,
                mapId = drop.MapId,
                x = drop.X,
                y = drop.Y,
                isGold = drop.ItemDefId == -1,
                goldAmount = drop.ItemDefId == -1 ? drop.Level : 0
            });
        }
    }

    public async Task HandleUsePotion(string connectionId, int itemDefId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (!GameData.Items.TryGetValue(itemDefId, out var itemDef) || itemDef.Type != "potion")
            return;

        var invItem = player.Inventory.FirstOrDefault(i => i.ItemDefId == itemDefId && !i.Equipped);
        if (invItem == null)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "You don't have that potion"
            });
            return;
        }

        if (itemDef.HealHp > 0) player.Heal(itemDef.HealHp);
        if (itemDef.HealMp > 0) player.HealMp(itemDef.HealMp);

        player.RemoveItemFromInventory(invItem.Id);

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.Message,
            text = $"Used {itemDef.Name}",
            category = "potion"
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.StatUpdate,
            hp = player.HP,
            maxHp = player.MaxHP,
            mp = player.MP,
            maxMp = player.MaxMP
        });

        await BroadcastInventory(player);
    }

    public async Task HandlePickupItem(string connectionId, string itemId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        var item = _lootSystem.PickupItem(itemId);
        if (item == null)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Item not found or already picked up"
            });
            return;
        }

        if (item.ItemDefId == -1)
        {
            player.Gold += item.Level;
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.GoldUpdate,
                gold = player.Gold
            });
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Message,
                text = $"Picked up {item.Level} gold",
                category = "loot"
            });

            await _webSocketHandler.Broadcast(new
            {
                type = Protocol.ItemRemoved,
                id = item.Id
            });
            return;
        }

        if (!GameData.Items.TryGetValue(item.ItemDefId, out var itemDef))
        {
            _lootSystem.RemoveDrop(item.Id);
            return;
        }

        item.Definition = itemDef;

        if (!player.AddItemToInventory(item))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Inventory is full"
            });
            return;
        }

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.ItemRemoved,
            id = item.Id
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.Message,
            text = $"Picked up {itemDef.Name}",
            category = "loot"
        });

        await BroadcastInventory(player);
    }

    public async Task HandleBuyItem(string connectionId, int itemDefId, int npcId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (!GameData.Items.TryGetValue(itemDefId, out var itemDef))
            return;

        if (!GameData.NPCs.TryGetValue(npcId, out var npc) || !npc.ShopItems.Contains(itemDefId))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "NPC doesn't sell that item"
            });
            return;
        }

        if (player.Gold < itemDef.Value)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Not enough gold"
            });
            return;
        }

        if (player.Inventory.Count >= 60)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Inventory is full"
            });
            return;
        }

        player.Gold -= itemDef.Value;
        var newItem = new ItemInstance
        {
            Id = Guid.NewGuid().ToString("N"),
            ItemDefId = itemDefId,
            Definition = itemDef,
            Level = 0,
            Luck = false,
            OwnerId = player.Id.ToString()
        };
        player.AddItemToInventory(newItem);

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.GoldUpdate,
            gold = player.Gold
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.Message,
            text = $"Bought {itemDef.Name} for {itemDef.Value} gold",
            category = "shop"
        });

        await BroadcastInventory(player);
    }

    public async Task HandleSellItem(string connectionId, string itemId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        var item = player.Inventory.FirstOrDefault(i => i.Id == itemId && !i.Equipped);
        if (item?.Definition == null) return;

        int sellPrice = item.Definition.Value / 3;
        player.Gold += Math.Max(1, sellPrice);
        player.RemoveItemFromInventory(itemId);

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.GoldUpdate,
            gold = player.Gold
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.Message,
            text = $"Sold {item.Definition.Name} for {sellPrice} gold",
            category = "shop"
        });

        await BroadcastInventory(player);
    }

    public async Task HandleEquipItem(string connectionId, string itemId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (player.EquipItem(itemId))
        {
            await BroadcastInventory(player);
            await BroadcastEquipment(player);
        }
        else
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Cannot equip this item"
            });
        }
    }

    public async Task HandleUnequipItem(string connectionId, string slot)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (player.UnequipItem(slot))
        {
            await BroadcastInventory(player);
            await BroadcastEquipment(player);
        }
        else
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Inventory is full"
            });
        }
    }

    public async Task HandleStatUp(string connectionId, string stat)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (player.AddStat(stat))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.StatUpdate,
                str = player.Str,
                agi = player.Agi,
                vit = player.Vit,
                ene = player.Ene,
                statPoints = player.StatPoints,
                hp = player.HP,
                maxHp = player.MaxHP,
                mp = player.MP,
                maxMp = player.MaxMP,
                attackMin = player.AttackMin,
                attackMax = player.AttackMax,
                defense = player.Defense,
                attackRate = player.AttackRate,
                defenseRate = player.DefenseRate
            });
        }
        else
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "No stat points available"
            });
        }
    }

    public async Task HandleChat(string connectionId, string message, string targetId = "")
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        var chatMsg = new
        {
            type = Protocol.ChatMessage,
            senderId = player.Id,
            senderName = player.Name,
            message,
            senderLevel = player.Level
        };

        if (!string.IsNullOrEmpty(targetId))
        {
            var target = _players.Values.FirstOrDefault(p => p.Id.ToString() == targetId || p.Name == targetId);
            if (target != null)
            {
                await _webSocketHandler.SendToPlayer(target.ConnectionId, chatMsg);
                await _webSocketHandler.SendToPlayer(connectionId, chatMsg);
            }
        }
        else
        {
            await _webSocketHandler.Broadcast(chatMsg);
        }
    }

    public async Task HandleRequestMap(string connectionId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (!GameData.Maps.TryGetValue(player.MapId, out var map)) return;

        var npcs = map.Npcs.Select(npcId => GameData.NPCs.GetValueOrDefault(npcId))
            .Where(n => n != null)
            .Select(n => new { id = n!.Id, name = n.Name, x = n.X, y = n.Y, shopItems = n.ShopItems })
            .ToList();

        var mapMonsters = _spawnSystem.GetMonstersOnMap(player.MapId)
            .Where(m => !m.IsDead)
            .Select(m => new
            {
                entityId = m.EntityId,
                definitionId = m.DefinitionId,
                name = m.Name,
                level = m.Level,
                hp = m.HP,
                maxHp = m.MaxHP,
                x = m.X,
                y = m.Y,
                state = m.State
            });

        var dropped = _lootSystem.GetDroppedItemsOnMap(player.MapId)
            .Select(d => new
            {
                id = d.Id,
                itemDefId = d.ItemDefId,
                x = d.X,
                y = d.Y,
                isGold = d.ItemDefId == -1,
                goldAmount = d.ItemDefId == -1 ? d.Level : 0
            });

        var otherPlayers = _players.Values
            .Where(p => p.IsConnected && p.ConnectionId != connectionId && p.MapId == player.MapId)
            .Select(p => new
            {
                id = p.Id,
                name = p.Name,
                className = p.Class,
                level = p.Level,
                hp = p.HP,
                maxHp = p.MaxHP,
                mp = p.MP,
                maxMp = p.MaxMP,
                x = p.X,
                y = p.Y
            });

        var connections = map.Connections.Select(c => new { mapId = c.MapId, x = c.X, y = c.Y });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.MapLoaded,
            mapId = player.MapId,
            mapName = map.Name,
            width = map.Width,
            height = map.Height,
            players = otherPlayers,
            monsters = mapMonsters,
            droppedItems = dropped,
            npcs,
            connections
        });
    }

    public async Task HandleLogin(string connectionId, string name, string className)
    {
        var existingPlayer = _players.Values.FirstOrDefault(p => p.Name == name && p.IsConnected);
        if (existingPlayer != null)
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Player with that name is already online"
            });
            return;
        }

        var player = CreatePlayer(connectionId, name, className);

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.Message,
            text = $"Welcome to Mu Online, {player.Name}!",
            category = "login"
        });

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.StatUpdate,
            id = player.Id,
            name = player.Name,
            className = player.Class,
            level = player.Level,
            xp = player.XP,
            xpForNext = player.XpForNextLevel,
            statPoints = player.StatPoints,
            str = player.Str,
            agi = player.Agi,
            vit = player.Vit,
            ene = player.Ene,
            hp = player.HP,
            maxHp = player.MaxHP,
            mp = player.MP,
            maxMp = player.MaxMP,
            attackMin = player.AttackMin,
            attackMax = player.AttackMax,
            defense = player.Defense,
            attackRate = player.AttackRate,
            defenseRate = player.DefenseRate,
            gold = player.Gold,
            mapId = player.MapId,
            x = player.X,
            y = player.Y
        });

        var skillList = player.Skills.Select(skillId =>
        {
            GameData.Skills.TryGetValue(skillId, out var sk);
            return new
            {
                id = skillId,
                name = sk?.Name ?? "Unknown",
                levelReq = sk?.LevelReq ?? 0,
                manaCost = sk?.ManaCost ?? 0,
                cooldown = sk?.Cooldown ?? 0,
                damageModifier = sk?.DamageModifier ?? 1.0,
                range = sk?.Range ?? 1,
                areaOfEffect = sk?.AreaOfEffect ?? 0
            };
        }).ToList();

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = "SkillList",
            skills = skillList
        });

        await BroadcastInventory(player);
        await BroadcastEquipment(player);

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.PlayerJoined,
            id = player.Id,
            name = player.Name,
            className = player.Class,
            level = player.Level,
            mapId = player.MapId,
            x = player.X,
            y = player.Y
        });

        await HandleRequestMap(connectionId);

        if (GameData.Maps.TryGetValue(player.MapId, out var map))
        {
            var npcs = map.Npcs.Select(npcId => GameData.NPCs.GetValueOrDefault(npcId))
                .Where(n => n != null)
                .Select(n => new { id = n!.Id, name = n.Name, x = n.X, y = n.Y, shopItems = n.ShopItems })
                .ToList();

            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.NpcList,
                npcs
            });
        }
    }

    public async Task HandleTeleport(string connectionId, int mapId, int x, int y)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (!GameData.Maps.ContainsKey(mapId)) return;

        if (!GameData.Maps.TryGetValue(player.MapId, out var currentMap) ||
            !currentMap.Connections.Any(c => c.MapId == mapId))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Cannot teleport to that map"
            });
            return;
        }

        player.MapId = mapId;
        player.X = x > 0 ? x : 100;
        player.Y = y > 0 ? y : 100;

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.PlayerPosition,
            id = player.Id,
            name = player.Name,
            mapId = player.MapId,
            x = player.X,
            y = player.Y
        });

        await HandleRequestMap(connectionId);
    }

    public async Task HandleRequestShop(string connectionId, int npcId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        if (!GameData.NPCs.TryGetValue(npcId, out var npc))
        {
            await _webSocketHandler.SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "NPC not found"
            });
            return;
        }

        var shopItems = npc.ShopItems
            .Select(itemId => GameData.Items.GetValueOrDefault(itemId))
            .Where(i => i != null)
            .Select(i => new
            {
                id = i!.Id,
                name = i.Name,
                type = i.Type,
                slot = i.Slot,
                level = i.Level,
                attackMin = i.AttackMin,
                attackMax = i.AttackMax,
                defense = i.Defense,
                wizRaise = i.WizRaise,
                reqStr = i.ReqStr,
                reqAgi = i.ReqAgi,
                reqVit = i.ReqVit,
                reqEne = i.ReqEne,
                value = i.Value,
                icon = i.Icon,
                healHp = i.HealHp,
                healMp = i.HealMp
            })
            .ToList();

        await _webSocketHandler.SendToPlayer(connectionId, new
        {
            type = Protocol.ShopInventory,
            npcId,
            npcName = npc.Name,
            items = shopItems
        });
    }

    public async Task HandleDropItem(string connectionId, string itemId)
    {
        var player = GetPlayerByConnectionId(connectionId);
        if (player == null) return;

        var item = player.Inventory.FirstOrDefault(i => i.Id == itemId && !i.Equipped);
        if (item?.Definition == null) return;

        player.RemoveItemFromInventory(itemId);

        item.Dropped = true;
        item.DropTime = Environment.TickCount64;
        item.X = player.X;
        item.Y = player.Y;
        item.MapId = player.MapId;

        _lootSystem.AddDroppedItem(item);

        await _webSocketHandler.Broadcast(new
        {
            type = Protocol.ItemDropped,
            id = item.Id,
            itemDefId = item.ItemDefId,
            mapId = player.MapId,
            x = player.X,
            y = player.Y,
            isGold = false,
            goldAmount = 0
        });

        await BroadcastInventory(player);
    }

    private async Task BroadcastInventory(Player player)
    {
        var inventory = player.Inventory.Select(i =>
        {
            var def = i.Definition ?? GameData.Items.GetValueOrDefault(i.ItemDefId);
            return new
            {
                id = i.Id,
                itemDefId = i.ItemDefId,
                name = def?.Name ?? "Unknown",
                type = def?.Type ?? "",
                slot = def?.Slot ?? "",
                equipped = i.Equipped,
                inventorySlot = i.Slot,
                luck = i.Luck,
                level = i.Level,
                attackMin = def?.AttackMin ?? 0,
                attackMax = def?.AttackMax ?? 0,
                defense = def?.Defense ?? 0,
                wizRaise = def?.WizRaise ?? 0,
                healHp = def?.HealHp ?? 0,
                healMp = def?.HealMp ?? 0,
                value = def?.Value ?? 0,
                icon = def?.Icon ?? 0
            };
        }).ToList();

        await _webSocketHandler.SendToPlayer(player.ConnectionId, new
        {
            type = Protocol.InventoryUpdate,
            items = inventory
        });
    }

    private async Task BroadcastEquipment(Player player)
    {
        var equipment = player.Equipment
            .Where(kvp => kvp.Value != null)
            .ToDictionary(kvp => kvp.Key, kvp =>
            {
                var item = kvp.Value!;
                var def = item.Definition ?? GameData.Items.GetValueOrDefault(item.ItemDefId);
                return new
                {
                    id = item.Id,
                    itemDefId = item.ItemDefId,
                    name = def?.Name ?? "Unknown",
                    luck = item.Luck,
                    level = item.Level,
                    attackMin = def?.AttackMin ?? 0,
                    attackMax = def?.AttackMax ?? 0,
                    defense = def?.Defense ?? 0,
                    wizRaise = def?.WizRaise ?? 0,
                    icon = def?.Icon ?? 0
                };
            });

        await _webSocketHandler.SendToPlayer(player.ConnectionId, new
        {
            type = Protocol.EquipmentUpdate,
            equipment
        });
    }

    private void LoadPlayers()
    {
        try
        {
            if (!File.Exists(_saveFilePath)) return;
            var json = File.ReadAllText(_saveFilePath);
            var saveData = System.Text.Json.JsonSerializer.Deserialize<List<PlayerSaveData>>(json);
            if (saveData == null) return;

            foreach (var sd in saveData)
            {
                var player = new Player
                {
                    Name = sd.Name,
                    Class = sd.Class,
                    Level = sd.Level,
                    XP = sd.XP,
                    Str = sd.Str,
                    Agi = sd.Agi,
                    Vit = sd.Vit,
                    Ene = sd.Ene,
                    StatPoints = sd.StatPoints,
                    Gold = sd.Gold,
                    HP = sd.HP,
                    MP = sd.MP,
                    MapId = sd.MapId,
                    X = sd.X,
                    Y = sd.Y,
                    IsConnected = false
                };
                player.RecalcStats();
                // We store them but they'll reconnect later
            }
        }
        catch { }
    }

    public void SavePlayers()
    {
        try
        {
            var saveData = _players.Values.Select(p => new PlayerSaveData
            {
                Name = p.Name,
                Class = p.Class,
                Level = p.Level,
                XP = p.XP,
                Str = p.Str,
                Agi = p.Agi,
                Vit = p.Vit,
                Ene = p.Ene,
                StatPoints = p.StatPoints,
                Gold = p.Gold,
                HP = p.HP,
                MP = p.MP,
                MapId = p.MapId,
                X = p.X,
                Y = p.Y
            }).ToList();

            var json = System.Text.Json.JsonSerializer.Serialize(saveData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_saveFilePath, json);
        }
        catch { }
    }
}

public class PlayerSaveData
{
    public string Name { get; set; } = "";
    public string Class { get; set; } = "";
    public int Level { get; set; }
    public long XP { get; set; }
    public int Str { get; set; }
    public int Agi { get; set; }
    public int Vit { get; set; }
    public int Ene { get; set; }
    public int StatPoints { get; set; }
    public int Gold { get; set; }
    public int HP { get; set; }
    public int MP { get; set; }
    public int MapId { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
}
