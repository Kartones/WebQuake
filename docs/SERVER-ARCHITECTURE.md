# WebQuake Server Architecture

## Overview

The WebQuake server (WebQDS - Web Quake Dedicated Server) is a Node.js-based implementation of the Quake dedicated server. It handles multiplayer game logic, player connections, entity simulation, and network communication. The server shares many modules with the client but excludes rendering-related code, focusing instead on game state management, physics, and scripting.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Node.js Runtime Environment                │
│  (dgram, http, websocket, fs, os, url from Node)       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   WebQDS.js (Entry Point)               │
│         (Requires & Initializes All Modules)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Core Server Modules                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Host    │ │   SV     │ │ HostSvr  │ │   PR     │   │
│  │(Engine)  │ │(Gameplay)│ │(Listener)│ │(Scripts) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
          │         │              │          │
          ├─────────┼──────────────┼──────────┤
          ▼         ▼              ▼          ▼
    ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
    │ NET.js │ │EM/PF   │ │HostCmds  │ │HostClient│
    │(Routing)│(Entity) │ │(Console) │ │(Player)  │
    └────────┘ └────────┘ └──────────┘ └──────────┘
          │         │              │          │
          ├─────────┴──────────────┴──────────┤
          ▼                                    ▼
    ┌─────────────┐              ┌──────────────────┐
    │  NET_WEBS   │              │  NET_Datagram    │
    │(WebSocket)  │              │(UDP Transport)   │
    └─────────────┘              └──────────────────┘
          │                              │
          └──────────────┬───────────────┘
                         ▼
        ┌────────────────────────────────┐
        │  Client Connections & Messages │
        │ (HTTP, WebSocket, UDP/TCP)     │
        └────────────────────────────────┘
```

## Module Breakdown

### Core Engine Modules

**Host.js** - Server Engine Control (4.7KB)
- Main game loop orchestration and timing
- Frame rate and tick rate management (default 20 Hz)
- Server initialization and shutdown
- Global game state and timing variables
- RCON (remote console) password management
- Game rules (fraglimit, timelimit, skill level, etc.)
- Dependencies: Most other modules
- Responsibilities: Coordinates all subsystems, frame execution timing

**SV.js** - Server Gameplay Logic (75KB, largest module)
- Game state management and entity simulation
- Physics engine (movement, collision detection)
- Entity spawning and despawning
- QuakeC script execution for game entities
- Damage system and player respawning
- Server-side movement validation
- Weapon firing and hit detection
- Game rules enforcement (powerups, items, scoring)
- Demo recording
- Dependencies: PR (scripting), PF (built-in functions), ED (entity data)

**HostServer.js** - Server Initialization & Configuration (4.9KB)
- Server startup and listener setup
- Maximum player detection and configuration
- Client slots initialization
- Server info API endpoints
- Health check and status reporting
- Dependencies: NET_WEBS, SV, Host

**HostCommands.js** - Console Commands (21KB)
- Server-side console command implementation
- Command execution handlers
- Admin commands (kick, ban, map change, etc.)
- Game configuration commands
- Player management commands
- Dependencies: SV, Host, HostClient

### Client Management Modules

**HostClient.js** - Client Communication (835B)
- Client message broadcasting
- Player print/notification delivery
- Error propagation to clients
- Message queueing for individual clients

### Networking Modules

**NET.js** - Network Abstraction (5.6KB)
- Generic network interface
- Multiple transport backend support
- Message routing and dispatch
- Connection management interface

**NET_WEBS.js** - WebSocket Transport (13KB)
- HTTP server creation and management
- WebSocket connection acceptance
- Message receive from WebSocket clients
- Server status template rendering
- Player info API endpoints (/server_info, /player_info, /rule_info)
- Color palette loading for status display
- Dependencies: Node.js (http, websocket), COM, MSG, Protocol

**NET_Datagram.js** - UDP/TCP Transport (12KB)
- UDP datagram socket creation
- TCP connection handling
- Datagram send/receive
- Packet assembly from datagrams
- Connection handshaking
- Dependencies: Node.js (dgram, os)

**Protocol.js** - Network Protocol
- Server-to-client message types (svc_print, svc_serverinfo, etc.)
- Client-to-server command types
- Protocol version definitions and compatibility checks

### Game Logic & Scripting Modules

**PR.js** - QuakeC Virtual Machine (23KB)
- QuakeC script execution engine
- Bytecode interpreter (VM stack-based)
- Function call dispatch
- Variable storage and access
- Type system (void, string, float, vector, entity, field, function, pointer)
- Built-in operator implementation (arithmetic, comparisons, string ops)
- Memory management for script data
- Dependencies: ED (entity definitions), PF (built-in functions)

**PF.js** - Built-in Functions (22KB)
- Standard QuakeC functions (print, spawn, remove, etc.)
- Vector and math operations
- Entity manipulation functions
- Trace and line-of-sight functions (checkbottom, traceline, findradius)
- Player input handling
- Sound/effect triggering
- Dependencies: SV, MSG, Vec, ED

**ED.js** - Entity Definitions (8.5KB)
- Entity field definitions and metadata
- Entity property parsing and storage
- QuakeC field type mapping
- Entity serialization for network transmission

### Configuration & Command Modules

**Cmd.js** - Command Parsing (3.7KB)
- Console command tokenization and parsing
- Command argument handling
- Command execution dispatch

**Cvar.js** - Console Variables (1.7KB)
- Game configuration variable storage
- Variable lookup and modification
- Variable callbacks on change

**COM.js** - Common Utilities (7.6KB)
- File loading and caching
- Resource management
- Command-line argument parsing
- String utilities and formatting
- Path handling

### Data Structure & Utility Modules

**MSG.js** - Message Parsing (2.3KB)
- Binary message encoding/decoding
- Data serialization (bytes, shorts, longs, floats, strings, vectors)
- Protocol message construction
- Buffer management

**SZ.js** - Byte Sized Buffer (958B)
- Byte buffer operations
- Bit-level data manipulation

**Q.js** - Global State (2.7KB)
- Global game state variables
- Entity arrays
- Frame timing and tick globals
- Server session state

**ED.js** - Entity Definition (8.5KB) [duplicate entry, see above]
- Entity field storage and access
- Entity linking/unlinking for spatial queries

**Vec.js** - Vector Math (359B)
- Vector operations (length, normalize, etc.)
- Vector utilities shared with client

**V.js** - View/Angle Calculations (550B)
- View angle computations
- Direction vector calculations

**CRC.js** - Checksum (2.3KB)
- CRC calculation for data validation
- Packet integrity verification

**Def.js** - Definitions (325B)
- Global constants and type definitions
- Limit constants

**Console.js** - Console Interface (231B)
- Basic console stub for server

**Sys.js** - System Interface (816B)
- Error handling and reporting
- Debug output
- Fatal error handling

## Data Flow

### Server Loop
```
Host.Frame()
    │
    ├─► NET.RunUntilRejected()        (receive client packets)
    │       ↓
    │       ├─► NET_WEBS.Listen()     (accept WebSocket connections)
    │       └─► NET_Datagram.Listen() (accept UDP connections)
    │
    ├─► SV.RunFrame() (if time is due)
    │       ├─► SV.CheckForNewClients() (accept new players)
    │       ├─► SV.ReadClientMessage()  (process input)
    │       ├─► SV.Physics()            (move entities, collisions)
    │       ├─► SV.RunCycle()           (execute QuakeC scripts)
    │       │   └─► PR.ExecuteProgram() (run entity think functions)
    │       ├─► SV.RunEntities()        (update entity state)
    │       └─► SV.WriteClientMessages() (queue updates)
    │
    ├─► NET.SendPacketToClients()   (transmit state updates)
    │       ├─► NET_WEBS.SendMessage()
    │       └─► NET_Datagram.SendPacket()
    │
    └─► Host.CheckForRestart()
```

### Client Connection Lifecycle
```
1. Client Initiates Connection
    ↓
2. NET_WEBS.Listen() / NET_Datagram.Listen()
    ↓
3. SV.CheckForNewClients()
    ↓
4. HostServer receives client info
    ↓
5. SV.ConnectClient()
    ├─► Allocate client slot
    ├─► Load model data
    ├─► Position entity in world
    └─► Queue spawn packet to client
    ↓
6. SV.RunFrame() begins gameplay loop
    ├─► Read client commands (movement, attacks)
    ├─► Update entity position/state
    ├─► Send state updates to all clients
    └─► Repeat until disconnect
    ↓
7. SV.DropClient() (on disconnect)
    ├─► Remove entity from world
    └─► Free client slot
```

### Entity State Synchronization
```
SV.RunCycle()
    ↓
PR.ExecuteProgram() (run entity think functions)
    ├─► QuakeC update position/orientation
    ├─► Check collisions with other entities
    ├─► Trigger damage/effects
    └─► Update state variables
    ↓
SV.WriteClientMessages()
    ├─► Serialize entity state
    ├─► Build delta from last known state
    ├─► Compress message
    └─► Queue for transmission
    ↓
NET_WEBS/NET_Datagram SendPacket()
    └─► Transmit to all connected clients
```

### Script Execution Pipeline
```
SV.RunFrame() → SV.RunCycle()
    ↓
For each entity in world:
    ├─► Check if entity has a think function
    └─► If time to think:
        └─► PR.ExecuteProgram(think_function)
            ├─► Fetch function pointer from QuakeC data
            ├─► Set up execution context
            ├─► Execute bytecode
            │   ├─► Variable access/modification
            │   ├─► Function calls (built-in via PF.js)
            │   ├─► Conditional logic
            │   └─► Stack operations
            ├─► Call built-in functions as needed
            │   ├─► SpawnEntity() → creates new entity
            │   ├─► TraceLine() → hit detection
            │   ├─► FindRadius() → area queries
            │   └─► TriggerEffect() → spawns particles, plays sounds
            └─► Return updated entity state
```

## Key Design Patterns

1. **Module Pattern**: Each module is a singleton object with methods and private state
2. **Immediate Execution**: All modules load in dependency order via require()
3. **Shared Global State**: Modules communicate through global objects (SV, Host, NET, PR, etc.)
4. **Binary Protocol**: Network and entity data use compact binary serialization (MSG.js)
5. **Virtual Machine**: QuakeC scripts run in a custom interpreter (PR.js)
6. **Entity System**: Game objects represented as entities with scripted behavior

## Network Communication

### Message Types (Server → Client)
- `svc_print`: Display text message
- `svc_serverinfo`: Initial game state
- `svc_clientdata`: Player status (health, ammo, etc.)
- `svc_update`: Entity position/state update
- `svc_disconnect`: Server disconnection reason

### Message Types (Client → Server)
- `clc_move`: Player movement input
- `clc_stringcmd`: Console command execution
- `clc_nop`: No-op for keepalive

### API Endpoints (HTTP)
- `/server_info` - Server name, level, player count, limits
- `/player_info` - Connected player details (name, color, IP, score)
- `/rule_info` - Server configuration variables

## Resource Types

- **Maps**: .bsp files (world geometry, entity spawning positions)
- **Models**: .mdl files (player/monster models)
- **Sprites**: .spr files (projectiles, effects)
- **Sound**: .wav files (game effects)
- **Scripts**: QuakeC compiled bytecode (.o files)
- **Textures**: Embedded in .bsp or separate .lmp files
- **Configuration**: .cfg files (server config, entity definitions)

## Startup & Initialization

```
1. WebQDS.js (entry point)
    ├─► Load Node.js modules (dgram, http, fs, websocket, etc.)
    ├─► Require all server modules in order
    │   ├─► Utilities (Def, Q, Vec, SZ, CRC, MSG, COM, Protocol, Cvar, Cmd)
    │   ├─► Scripting (ED, PR, PF)
    │   ├─► Networking (NET, NET_WEBS, NET_Datagram)
    │   ├─► Game Logic (SV, HostCommands)
    │   ├─► Client Management (HostClient, HostServer)
    │   └─► Server Control (Host)
    │
    ├─► HostServer.FindMaxClients()
    │   └─► Parse -maxplayers argument
    │
    ├─► COM.ParseArguments()
    │   └─► Process all command-line arguments
    │
    ├─► NET_WEBS.Init()
    │   ├─► Load color palette
    │   ├─► Create HTTP server
    │   ├─► Listen on port (default 26000)
    │   └─► Set up WebSocket upgrade handler
    │
    ├─► NET_Datagram.Init()
    │   ├─► Create UDP socket
    │   └─► Listen for datagram packets
    │
    ├─► SV.InitGame()
    │   ├─► Load map (.bsp)
    │   ├─► Initialize entity list
    │   ├─► Execute map spawn script
    │   └─► Create game entities (weapons, items, monsters)
    │
    └─► Host.Frame() infinite loop
        └─► Main server game loop (runs continuously)
```

## Comparison with Client

| Aspect | Server | Client |
|--------|--------|--------|
| **Language** | Node.js (JavaScript) | Browser JavaScript |
| **Rendering** | None (headless) | WebGL/Canvas 2D |
| **Input** | Network messages | Keyboard/Mouse/Controller |
| **Physics** | Server-authoritative | Predicts locally, corrects on update |
| **Scripts** | QuakeC VM (PR.js) | Embedded in maps |
| **Entity Update Rate** | 20 Hz (configurable) | Varies with network |
| **Audio** | None | Web Audio API |
| **Key Modules** | SV, PR, PF, HOST_*, NET_* | CL, R, GL, S, M |
| **Transport** | WebSocket, UDP/TCP | WebSocket |

## Performance Considerations

- **Server Loop Timing**: Runs at fixed tick rate (default 20 Hz / 50ms per frame)
- **Physics Simulation**: Simplified bounding box collisions
- **QuakeC Execution**: Interpreted bytecode (no JIT compilation)
- **Network Batching**: Entity updates batched per client per frame
- **Memory**: Entity pool pre-allocated for maximum players
- **Scalability**: Designed for 8-16 players per server instance

## Entry Point

1. **WebQDS.js** requires all modules in dependency order
2. **HostServer.FindMaxClients()** parses startup arguments
3. **NET_WEBS.Init()** and **NET_Datagram.Init()** start listeners
4. **SV.InitGame()** loads map and initializes game
5. **Host.Frame()** runs indefinitely as main game loop
   - Receives packets from NET
   - Updates game state via SV.RunFrame()
   - Sends updates to clients via NET

## Node.js Dependencies

- **dgram**: UDP socket for native Quake protocol support
- **http**: HTTP server for web status API and WebSocket upgrade
- **websocket**: WebSocket library for browser clients
- **fs**: File system access for pak/map/model loading
- **os**: OS utilities for network interface information
- **url**: URL parsing for HTTP requests
