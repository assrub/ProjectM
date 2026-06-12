namespace MuServer.Networking;

public static class Protocol
{
    // Client -> Server message types
    public const string Move = "Move";
    public const string Attack = "Attack";
    public const string UseSkill = "UseSkill";
    public const string UsePotion = "UsePotion";
    public const string PickupItem = "PickupItem";
    public const string BuyItem = "BuyItem";
    public const string SellItem = "SellItem";
    public const string EquipItem = "EquipItem";
    public const string UnequipItem = "UnequipItem";
    public const string StatUp = "StatUp";
    public const string Chat = "Chat";
    public const string RequestMap = "RequestMap";
    public const string Login = "Login";
    public const string Teleport = "Teleport";
    public const string JoinParty = "JoinParty";
    public const string LeaveParty = "LeaveParty";
    public const string RequestShop = "RequestShop";
    public const string DropItem = "DropItem";

    // Server -> Client message types
    public const string WorldState = "WorldState";
    public const string PlayerJoined = "PlayerJoined";
    public const string PlayerLeft = "PlayerLeft";
    public const string DamageDealt = "DamageDealt";
    public const string ItemDropped = "ItemDropped";
    public const string LevelUp = "LevelUp";
    public const string ChatMessage = "ChatMessage";
    public const string MapLoaded = "MapLoaded";
    public const string InventoryUpdate = "InventoryUpdate";
    public const string EquipmentUpdate = "EquipmentUpdate";
    public const string ShopInventory = "ShopInventory";
    public const string XpGained = "XpGained";
    public const string StatUpdate = "StatUpdate";
    public const string Message = "Message";
    public const string Error = "Error";
    public const string MonsterUpdate = "MonsterUpdate";
    public const string PlayerPosition = "PlayerPosition";
    public const string MonsterDied = "MonsterDied";
    public const string ItemRemoved = "ItemRemoved";
    public const string GoldUpdate = "GoldUpdate";
    public const string CooldownUpdate = "CooldownUpdate";
    public const string PartyUpdate = "PartyUpdate";
    public const string NpcList = "NpcList";
}
