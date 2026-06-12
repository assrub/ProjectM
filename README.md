# MU Online Mobile

Clon de Mu Online para Android con servidor multijugador en .NET.

## Estructura del Proyecto

```
muOnline/
├── server/          # Servidor .NET 8 con WebSocket
├── client/          # Proyecto Unity (Android)
├── docker-compose.yml
└── .github/         # CI/CD para build automático
```

## Requisitos

### Servidor
- Docker y Docker Compose

### Cliente (para compilar APK)
- Unity 2022.3.20f1+
- Android Build Support (IL2CPP, ARM64)
- JDK 11+, Android SDK (API 33), Android NDK

## Cómo ejecutar el servidor

```bash
docker compose up -d
```

El servidor corre en `http://localhost:3000`. Los clientes se conectan vía WebSocket a `ws://<IP-DEL-SERVIDOR>:3000/ws`.

Para ver logs:
```bash
docker compose logs -f mu-server
```

Para detener:
```bash
docker compose down
```

## Cómo compilar el APK

### Opción 1: Manual (recomendada)
1. Abre Unity Hub, agrega proyecto desde `client/`
2. Abre el proyecto en Unity 2022.3.20f1+
3. File > Build Settings > Android > Switch Platform
4. Build o Build And Run
5. El APK se genera en `client/Builds/MuOnlineMobile.apk`

### Opción 2: GitHub Actions (automático)
1. Fork del repositorio
2. Agrega estos secrets en Settings > Secrets:
   - `UNITY_LICENSE` - Tu licencia de Unity Personal
   - `UNITY_EMAIL` - Email de tu cuenta Unity
   - `UNITY_PASSWORD` - Password de tu cuenta Unity
   - `ANDROID_KEYSTORE_BASE64` - Keystore en base64
   - `ANDROID_KEYSTORE_PASS` - Password del keystore
   - `ANDROID_KEYALIAS_NAME` - Alias del key
   - `ANDROID_KEYALIAS_PASS` - Password del alias
3. Push a main/master
4. El APK se genera en Actions > Artifacts

## Cómo jugar

1. Asegúrate de que el servidor esté corriendo (ver arriba)
2. Abre el APK en tu Android
3. En la pantalla de inicio, ingresa la IP del servidor
4. Selecciona tu clase (Dark Knight, Elf, Mago)
5. ¡A jugar!

Los jugadores en la misma red WiFi pueden conectarse al mismo servidor.

## Personajes

| Clase | Arma | Stats principales | Rol |
|-------|------|-------------------|-----|
| Dark Knight | Espada | STR > AGI > VIT | Melee DPS/Tank |
| Elf | Arco | AGI > STR > ENE | Ranged DPS/Support |
| Mago | Staff | ENE > AGI > VIT | Magic DPS |

## Mapas

| Mapa | Nivel Recomendado | Conexiones |
|------|------------------|------------|
| Lorencia | 1-20 | Noria, Davias, Dungeon |
| Noria | 1-20 | Lorencia |
| Davias | 20-50 | Lorencia, Lost Tower |
| Dungeon Piso 1 | 20-30 | Lorencia, Dungeon 2 |
| Dungeon Piso 2 | 30-40 | Dungeon 1, Dungeon 3 |
| Dungeon Piso 3 | 40-50 | Dungeon 2 |
| Lost Tower 1-7 | 50-70 | Davias |

## Controles

- **Joystick virtual** (izquierda): Movimiento
- **Tap en monstruo**: Atacar
- **Skill bar** (abajo derecha): Usar habilidades
- **Botones de poción**: Recuperar HP/MP
- **Botón de inventario**: Equipar/usar items
- **Chat** (esquina inferior): Chatear con otros jugadores
- **Minimapa** (esquina superior derecha): Navegación

## Items

El sistema incluye:
- Armas específicas por clase (10 por clase)
- Armaduras por clase (sets completos: armor, helm, pants, gloves, boots)
- Pociones de HP y MP (3 tamaños cada una)
- Jewels (Bless, Soul, Chaos) para mejora de items
- Flechas para Elfos

### Mejora de Items
- +0 a +6: Jewel of Bless (100% éxito)
- +6 a +9: Jewel of Soul (50% éxito, 75% con Luck)
- Opción Luck: +5% de probabilidad de crítico

## Skills por Clase

### Dark Knight
- Twisting Slash (AoE, L30)
- Impale (Carga, L80)
- Swell Life (Buff HP, L120)
- Death Stab (L160)
- Rageful Blow (L170 + daño)
- Strike of Destruction (L220, AoE)

### Elf
- Penetration (Flecha perforante, L30)
- Heal (Curación, L56)
- Greater Damage/Defense (Buffs, L80)
- Ice Arrow (Congelante, L92)
- Triple Shot (Dispara 3 flechas, L150)

### Mago
- Fire Ball (L1), Power Wave (L7), Lightning (L13)
- Teleport (L17), Meteorite (L21)
- Ice (L25), Poison (L30), Flame (L34)
- Twister (L38), Hellfire (L42), Nova (L220, ultimate)

## Licencia

Proyecto personal. Mu Online es propiedad de Webzen Inc.
