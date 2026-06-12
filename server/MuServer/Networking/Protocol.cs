namespace MuServer.Networking;

public static class Protocol
{
    // Client -> Server message types
    public const string Login = "JOIN";
    public const string Move = "MOVE";
    public const string Attack = "ATTACK";
    public const string UseSkill = "USE_SKILL";
    public const string UsePotion = "USE_POTION";
    public const string PickupItem = "PICKUP_ITEM";
    public const string BuyItem = "BUY_ITEM";
    public const string SellItem = "SELL_ITEM";
    public const string EquipItem = "EQUIP_ITEM";
    public const string UnequipItem = "UNEQUIP_ITEM";
    public const string StatUp = "STAT_UP";
    public const string Chat = "CHAT";
    public const string RequestMap = "REQUEST_MAP";
    public const string Teleport = "TELEPORT";
    public const string RequestShop = "REQUEST_SHOP";
    public const string DropItem = "DROP_ITEM";
    public const string JoinParty = "PARTY_JOIN";
    public const string LeaveParty = "PARTY_LEAVE";

    // Server -> Client message types
    public const string WorldState = "WORLD_STATE";
    public const string PlayerJoined = "PLAYER_JOINED";
    public const string PlayerLeft = "PLAYER_LEFT";
    public const string DamageDealt = "DAMAGE_DEALT";
    public const string ItemDropped = "ITEM_DROPPED";
    public const string LevelUp = "LEVEL_UP";
    public const string ChatMessage = "CHAT_MESSAGE";
    public const string MapLoaded = "MAP_LOADED";
    public const string InventoryUpdate = "INVENTORY_UPDATE";
    public const string EquipmentUpdate = "EQUIPMENT_UPDATE";
    public const string ShopInventory = "SHOP_INVENTORY";
    public const string XpGained = "XP_GAINED";
    public const string StatUpdate = "STAT_UPDATE";
    public const string MonsterUpdate = "MONSTER_MOVED";
    public const string PlayerPosition = "PLAYER_MOVED";
    public const string MonsterDied = "MONSTER_DIED";
    public const string ItemRemoved = "ITEM_REMOVED";
    public const string GoldUpdate = "GOLD_UPDATE";
    public const string CooldownUpdate = "COOLDOWN_UPDATE";
    public const string PartyUpdate = "PARTY_UPDATE";
    public const string NpcList = "NPC_LIST";
    public const string Message = "GAME_MESSAGE";
    public const string Error = "ERROR";
}
