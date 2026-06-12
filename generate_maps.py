import json, random

def generate_tiles(width, height, complexity=0.15):
    tiles = [[0] * width for _ in range(height)]

    # Walls around the border
    for y in range(height):
        for x in range(width):
            if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                tiles[y][x] = 1

    # Random obstacles
    for _ in range(int(width * height * complexity)):
        x = random.randint(2, width - 3)
        y = random.randint(2, height - 3)
        size = random.randint(1, 3)
        for dy in range(size):
            for dx in range(size):
                tx, ty = x + dx, y + dy
                if 1 < tx < width - 2 and 1 < ty < height - 2:
                    tiles[ty][tx] = 1

    # Clear spawn areas (center)
    cx, cy = width // 2, height // 2
    for y in range(cy - 3, cy + 3):
        for x in range(cx - 3, cx + 3):
            if 0 <= y < height and 0 <= x < width:
                tiles[y][x] = 0

    return tiles

with open("server/MuServer/json/maps.json") as f:
    maps = json.load(f)

for m in maps:
    w, h = m.get("width", 80), m.get("height", 80)
    m["tileData"] = generate_tiles(w, h)

with open("server/MuServer/json/maps.json", "w") as f:
    json.dump(maps, f, indent=2)

# Also update client copy
with open("client/Assets/Resources/Data/maps.json") as f:
    client_maps = json.load(f)

for cm in client_maps:
    for sm in maps:
        if cm["id"] == sm["id"]:
            cm["tileData"] = sm["tileData"]
            break

with open("client/Assets/Resources/Data/maps.json", "w") as f:
    json.dump(client_maps, f, indent=2)

print("Generated tile data for", len(maps), "maps")
