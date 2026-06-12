using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using MuServer.Game;

namespace MuServer.Networking;

public class WebSocketHandler
{
    private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    private readonly ConcurrentDictionary<string, string> _connectionToPlayerId = new();
    private readonly World _world;
    private readonly JsonSerializerOptions _jsonOptions;

    public WebSocketHandler(World world)
    {
        _world = world;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task HandleConnection(HttpContext context)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = 400;
            return;
        }

        var ws = await context.WebSockets.AcceptWebSocketAsync();
        var connectionId = Guid.NewGuid().ToString("N");

        _connections.TryAdd(connectionId, ws);

        try
        {
            await ReceiveLoop(connectionId, ws);
        }
        catch (WebSocketException)
        {
            // Client disconnected
        }
        catch (OperationCanceledException)
        {
            // Timeout
        }
        finally
        {
            await HandleDisconnect(connectionId, ws);
        }
    }

    private async Task ReceiveLoop(string connectionId, WebSocket ws)
    {
        var buffer = new byte[1024 * 16];

        while (ws.State == WebSocketState.Open)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                break;
            }

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                await ProcessMessage(connectionId, json);
            }
        }
    }

    private async Task ProcessMessage(string connectionId, string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("type", out var typeProp))
                return;

            var type = typeProp.GetString() ?? "";

            switch (type)
            {
                case Protocol.Login:
                    var name = root.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                    var className = root.TryGetProperty("className", out var c) ? c.GetString() ?? "dk" : "";
                    await _world.HandleLogin(connectionId, name, className);
                    break;

                case Protocol.Move:
                    var mapId = root.TryGetProperty("mapId", out var m) ? m.GetInt32() : 1;
                    var x = root.TryGetProperty("x", out var px) ? px.GetInt32() : 0;
                    var y = root.TryGetProperty("y", out var py) ? py.GetInt32() : 0;
                    _world.HandlePlayerMove(connectionId, mapId, x, y);
                    break;

                case Protocol.Attack:
                    var monsterId = root.TryGetProperty("monsterId", out var mid) ? mid.GetInt32() : 0;
                    var skillId = root.TryGetProperty("skillId", out var sid) ? sid.GetInt32() : 1;
                    await _world.HandlePlayerAttack(connectionId, monsterId, skillId);
                    break;

                case Protocol.UseSkill:
                    var targetMonsterId = root.TryGetProperty("monsterId", out var tmid) ? tmid.GetInt32() : 0;
                    var castSkillId = root.TryGetProperty("skillId", out var csid) ? csid.GetInt32() : 1;
                    await _world.HandlePlayerAttack(connectionId, targetMonsterId, castSkillId);
                    break;

                case Protocol.UsePotion:
                    var potionItemDefId = root.TryGetProperty("itemDefId", out var pid) ? pid.GetInt32() : 0;
                    await _world.HandleUsePotion(connectionId, potionItemDefId);
                    break;

                case Protocol.PickupItem:
                    var pickupItemId = root.TryGetProperty("itemId", out var iid) ? iid.GetString() ?? "" : "";
                    await _world.HandlePickupItem(connectionId, pickupItemId);
                    break;

                case Protocol.BuyItem:
                    var buyItemDefId = root.TryGetProperty("itemDefId", out var bid) ? bid.GetInt32() : 0;
                    var buyNpcId = root.TryGetProperty("npcId", out var bnid) ? bnid.GetInt32() : 0;
                    await _world.HandleBuyItem(connectionId, buyItemDefId, buyNpcId);
                    break;

                case Protocol.SellItem:
                    var sellItemId = root.TryGetProperty("itemId", out var siid) ? siid.GetString() ?? "" : "";
                    await _world.HandleSellItem(connectionId, sellItemId);
                    break;

                case Protocol.EquipItem:
                    var equipItemId = root.TryGetProperty("itemId", out var eid) ? eid.GetString() ?? "" : "";
                    await _world.HandleEquipItem(connectionId, equipItemId);
                    break;

                case Protocol.UnequipItem:
                    var unequipSlot = root.TryGetProperty("slot", out var us) ? us.GetString() ?? "" : "";
                    await _world.HandleUnequipItem(connectionId, unequipSlot);
                    break;

                case Protocol.StatUp:
                    var stat = root.TryGetProperty("stat", out var st) ? st.GetString() ?? "" : "";
                    await _world.HandleStatUp(connectionId, stat);
                    break;

                case Protocol.Chat:
                    var chatMsg = root.TryGetProperty("message", out var cm) ? cm.GetString() ?? "" : "";
                    var targetId = root.TryGetProperty("targetId", out var ti) ? ti.GetString() ?? "" : "";
                    await _world.HandleChat(connectionId, chatMsg, targetId);
                    break;

                case Protocol.RequestMap:
                    await _world.HandleRequestMap(connectionId);
                    break;

                case Protocol.Teleport:
                    var teleMapId = root.TryGetProperty("mapId", out var tmi) ? tmi.GetInt32() : 1;
                    var teleX = root.TryGetProperty("x", out var tx) ? tx.GetInt32() : 0;
                    var teleY = root.TryGetProperty("y", out var ty) ? ty.GetInt32() : 0;
                    await _world.HandleTeleport(connectionId, teleMapId, teleX, teleY);
                    break;

                case Protocol.RequestShop:
                    var shopNpcId = root.TryGetProperty("npcId", out var sni) ? sni.GetInt32() : 0;
                    await _world.HandleRequestShop(connectionId, shopNpcId);
                    break;

                case Protocol.DropItem:
                    var dropItemId = root.TryGetProperty("itemId", out var di) ? di.GetString() ?? "" : "";
                    await _world.HandleDropItem(connectionId, dropItemId);
                    break;

                default:
                    await SendToPlayer(connectionId, new
                    {
                        type = Protocol.Error,
                        message = $"Unknown message type: {type}"
                    });
                    break;
            }
        }
        catch (JsonException)
        {
            await SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = "Invalid JSON"
            });
        }
        catch (Exception ex)
        {
            await SendToPlayer(connectionId, new
            {
                type = Protocol.Error,
                message = $"Server error: {ex.Message}"
            });
        }
    }

    private async Task HandleDisconnect(string connectionId, WebSocket ws)
    {
        _connections.TryRemove(connectionId, out _);
        _connectionToPlayerId.TryRemove(connectionId, out _);

        _world.RemovePlayer(connectionId);

        if (ws.State != WebSocketState.Closed && ws.State != WebSocketState.Aborted)
        {
            try
            {
                await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Disconnected", CancellationToken.None);
            }
            catch { }
        }
    }

    public async Task SendToPlayer(string connectionId, object message)
    {
        if (!_connections.TryGetValue(connectionId, out var ws))
            return;

        if (ws.State != WebSocketState.Open)
            return;

        try
        {
            var json = JsonSerializer.Serialize(message, _jsonOptions);
            var bytes = Encoding.UTF8.GetBytes(json);
            await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }
        catch
        {
            // Connection might have died
        }
    }

    public async Task Broadcast(object message)
    {
        var json = JsonSerializer.Serialize(message, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var tasks = new List<Task>();

        foreach (var kvp in _connections)
        {
            if (kvp.Value.State == WebSocketState.Open)
            {
                tasks.Add(SendSafe(kvp.Value, segment));
            }
        }

        await Task.WhenAll(tasks);
    }

    public async Task BroadcastToMap(int mapId, object message)
    {
        var json = JsonSerializer.Serialize(message, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var tasks = new List<Task>();

        foreach (var kvp in _connections)
        {
            if (kvp.Value.State != WebSocketState.Open) continue;

            var player = _world.GetPlayerByConnectionId(kvp.Key);
            if (player?.MapId == mapId)
            {
                tasks.Add(SendSafe(kvp.Value, segment));
            }
        }

        await Task.WhenAll(tasks);
    }

    private async Task SendSafe(WebSocket ws, ArraySegment<byte> data)
    {
        try
        {
            if (ws.State == WebSocketState.Open)
                await ws.SendAsync(data, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        catch { }
    }

    public int ConnectionCount => _connections.Count;
}
