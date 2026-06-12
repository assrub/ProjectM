using MuServer.Data;

namespace MuServer.Game;

public class Monster
{
    private static int _nextEntityId = 1000;
    private static readonly object _idLock = new();

    public int EntityId { get; private set; }
    public int DefinitionId { get; set; }
    public MonsterDefinition? Definition { get; set; }
    public string Name { get; set; } = "";
    public int Level { get; set; }
    public int HP { get; set; }
    public int MaxHP { get; set; }
    public int AttackMin { get; set; }
    public int AttackMax { get; set; }
    public int Defense { get; set; }
    public int AttackRate { get; set; }
    public int DefenseRate { get; set; }
    public int XpReward { get; set; }
    public int MoveSpeed { get; set; }

    public int MapId { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
    public int OriginalX { get; set; }
    public int OriginalY { get; set; }

    public string State { get; set; } = "Idle";
    public string? TargetPlayerId { get; set; }
    public bool IsDead { get; set; }

    public int AggroRange { get; set; } = 5;
    public int AttackRange { get; set; } = 1;
    public int RespawnTime { get; set; } = 15;
    public double RespawnTimer { get; set; }

    public double MoveTimer { get; set; }
    public double AttackTimer { get; set; }
    public double PatrolTimer { get; set; }
    public int PatrolDirX { get; set; }
    public int PatrolDirY { get; set; }

    public Monster()
    {
        lock (_idLock)
        {
            EntityId = _nextEntityId++;
        }
    }

    public void InitFromDefinition(MonsterDefinition def)
    {
        DefinitionId = def.Id;
        Definition = def;
        Name = def.Name;
        Level = def.Level;
        MaxHP = def.Hp;
        HP = MaxHP;
        AttackMin = def.AtkMin;
        AttackMax = def.AtkMax;
        Defense = def.Def;
        AttackRate = def.AtkRate;
        DefenseRate = def.DefRate;
        XpReward = def.Xp;
        AggroRange = def.AggroRange;
        AttackRange = def.AttackRange;
        MoveSpeed = def.MoveSpeed;
        RespawnTime = def.RespawnTime;

        State = "Idle";
        TargetPlayerId = null;
        IsDead = false;
        PatrolTimer = Random.Shared.NextDouble() * 5;
        PatrolDirX = 0;
        PatrolDirY = 0;
    }

    public int TakeDamage(int damage)
    {
        int actualDmg = Math.Max(1, damage - Defense / 3);
        HP = Math.Max(0, HP - actualDmg);
        return actualDmg;
    }

    public void Die()
    {
        IsDead = true;
        State = "Dead";
        TargetPlayerId = null;
        RespawnTimer = RespawnTime;
    }

    public void Reset()
    {
        IsDead = false;
        State = "Idle";
        HP = MaxHP;
        X = OriginalX;
        Y = OriginalY;
        TargetPlayerId = null;
        MoveTimer = 0;
        AttackTimer = 0;
        PatrolTimer = Random.Shared.NextDouble() * 5;
    }

    public void UpdateAI(double deltaTime, Dictionary<string, Player> players)
    {
        if (IsDead)
        {
            RespawnTimer -= deltaTime;
            return;
        }

        var playerOnMap = players.Values
            .Where(p => p.IsConnected && p.MapId == MapId)
            .ToList();

        if (State == "Idle" || State == "Patrol")
        {
            Player? nearest = null;
            double nearestDist = double.MaxValue;

            foreach (var p in playerOnMap)
            {
                double dist = Math.Sqrt(Math.Pow(p.X - X, 2) + Math.Pow(p.Y - Y, 2));
                if (dist <= AggroRange && dist < nearestDist)
                {
                    nearest = p;
                    nearestDist = dist;
                }
            }

            if (nearest != null)
            {
                State = "Chase";
                TargetPlayerId = nearest.ConnectionId;
            }
            else if (State == "Idle")
            {
                State = "Patrol";
                PatrolTimer = 2.0;
                PatrolDirX = Random.Shared.Next(-1, 2);
                PatrolDirY = Random.Shared.Next(-1, 2);
            }
        }

        if (State == "Chase" && TargetPlayerId != null)
        {
            if (!players.TryGetValue(TargetPlayerId, out var target) || !target.IsConnected || target.MapId != MapId)
            {
                State = "Idle";
                TargetPlayerId = null;
                return;
            }

            double dist = Math.Sqrt(Math.Pow(target.X - X, 2) + Math.Pow(target.Y - Y, 2));

            if (dist > AggroRange * 2)
            {
                State = "Idle";
                TargetPlayerId = null;
                return;
            }

            if (dist <= AttackRange)
            {
                State = "Attack";
            }
            else
            {
                MoveTowards(target.X, target.Y, deltaTime);
            }
        }

        if (State == "Attack" && TargetPlayerId != null)
        {
            if (!players.TryGetValue(TargetPlayerId, out var target) || !target.IsConnected || target.MapId != MapId)
            {
                State = "Idle";
                TargetPlayerId = null;
                return;
            }

            double dist = Math.Sqrt(Math.Pow(target.X - X, 2) + Math.Pow(target.Y - Y, 2));
            if (dist > AttackRange + 0.5)
            {
                State = "Chase";
            }
        }

        if (State == "Patrol")
        {
            PatrolTimer -= deltaTime;
            if (PatrolTimer <= 0)
            {
                PatrolDirX = Random.Shared.Next(-1, 2);
                PatrolDirY = Random.Shared.Next(-1, 2);
                PatrolTimer = 2.0 + Random.Shared.NextDouble() * 3;
            }

            MoveTimer += deltaTime;
            if (MoveTimer >= 0.5)
            {
                MoveTimer = 0;
                int nx = X + PatrolDirX;
                int ny = Y + PatrolDirY;
                if (Math.Abs(nx - OriginalX) <= 5 && Math.Abs(ny - OriginalY) <= 5)
                {
                    X = nx;
                    Y = ny;
                }
                else
                {
                    PatrolDirX = Random.Shared.Next(-1, 2);
                    PatrolDirY = Random.Shared.Next(-1, 2);
                }
            }
        }
    }

    private void MoveTowards(int targetX, int targetY, double deltaTime)
    {
        double dx = targetX - X;
        double dy = targetY - Y;
        double dist = Math.Sqrt(dx * dx + dy * dy);
        if (dist < 0.1) return;

        double speed = MoveSpeed * deltaTime;
        double moveX = (dx / dist) * speed;
        double moveY = (dy / dist) * speed;

        X = (int)Math.Round(X + moveX);
        Y = (int)Math.Round(Y + moveY);
    }

    public object ToSnapshot()
    {
        return new
        {
            entityId = EntityId,
            definitionId = DefinitionId,
            name = Name,
            level = Level,
            hp = HP,
            maxHp = MaxHP,
            mapId = MapId,
            x = X,
            y = Y,
            state = IsDead ? "Dead" : State
        };
    }
}
