# WebQuake Client Architecture

## Overview

The WebQuake client is a port of the original Quake engine to HTML5 and WebGL. It is structured as a modular system composed of interconnected JavaScript modules that mirror the architecture of the original C-based Quake codebase. The client runs entirely in the browser and communicates with servers via WebSockets.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    index.htm                             │
│         (HTML5 Canvas + WebGL + Script Loader)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Core Modules                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Host    │ │   CL     │ │    R     │ │    S     │   │
│  │(Engine)  │ │(Client)  │ │(Renderer)│ │ (Sound)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                    │                                     │
│         ┌──────────┼──────────┐                          │
│         ▼          ▼          ▼                          │
│    ┌────────┐ ┌────────┐ ┌────────────┐                │
│    │CL_Core │ │CL_Input│ │CL_Net      │                │
│    │CL_Demo │ │        │ │            │                │
│    │CL_Parse│ │        │ │            │                │
│    │CL_Efx  │ │        │ │            │                │
│    │CL_Light│ │        │ │            │                │
│    └────────┘ └────────┘ └────────────┘                │
└─────────────────────────────────────────────────────────┘
          │         │              │          │
          ├─────────┼──────────────┼──────────┤
          ▼         ▼              ▼          ▼
    ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
    │ GL.js  │ │NET.js  │ │ Input    │ │ Display  │
    │(WebGL) │ │(Socket)│ │ (IN.js)  │ │ (Sbar,   │
    └────────┘ └────────┘ │ Key.js   │ │  SCR.js) │
                           └──────────┘ └──────────┘
          │         │              │          │
          └─────────┴──────────────┴──────────┘
                    │
                    ▼
      ┌────────────────────────────────┐
      │  Utility & Support Modules     │
      │ (MSG, SZ, CRC, VID, Cvar, etc.)│
      └────────────────────────────────┘
```

## Module Breakdown

### Core Engine Modules

**Host.js** - Engine Control
- Main game loop orchestration
- Frame timing and updates
- Console commands and cheats
- Game state initialization and shutdown
- Dependencies: Most other modules
- Responsibilities: Coordinates all subsystems

**CL.js** - Client Logic Orchestrator (528 bytes)
- Main orchestrator for all client subsystems
- Coordinates client input, networking, entity management, effects, and parsing
- Dependencies: CL_Core, CL_Input, CL_Demo, CL_Parse, CL_Effects, CL_Light, CL_Net

**CL_Core.js** - Entity & State Management (15KB)
- Client connection state management
- Entity management and interpolation
- Server communication lifecycle
- Demo playback initialization
- Dependencies: Server communication, entity data

**CL_Input.js** - Input Handling (7KB)
- Keyboard and mouse input processing
- Movement command generation
- View angle adjustment
- Key state tracking
- Dependencies: Input system (IN.js, Key.js), movement handling

**CL_Demo.js** - Demo Recording & Playback (5KB)
- Demo recording functionality
- Demo playback functionality
- Time demo benchmarking
- Dependencies: File I/O, network messaging

**CL_Parse.js** - Server Message Parsing (15KB)
- Server message interpretation
- Entity state updates
- Sound effect queuing
- Visual effect processing
- Static entity handling
- Dependencies: Entity data, sound system, effects

**CL_Effects.js** - Temporary Entities & Effects (6KB)
- Temporary entity management (beams, explosions)
- Visual effect processing
- Particle effect generation
- Dependencies: Rendering system, sound system

**CL_Light.js** - Dynamic Lighting (1KB)
- Dynamic light allocation
- Light decay over time
- Dependencies: Rendering system

**CL_Net.js** - Network Communication (7KB)
- Remote console (rcon) commands
- Connection establishment and management
- Disconnection handling
- Message sending and receiving
- Keepalive message generation
- Dependencies: Network transport, messaging

#### CL Module Organization

The original monolithic `CL.js` (1,993 lines) was refactored into 8 focused modules following the Single Responsibility Principle:

| Module | Size | Responsibility |
|--------|------|-----------------|
| CL.js | 528 B | Orchestrator namespace |
| CL_Core.js | 15 KB | State initialization, entity lifecycle |
| CL_Input.js | 7 KB | Input processing and movement |
| CL_Demo.js | 5 KB | Demo recording/playback |
| CL_Parse.js | 15 KB | Server message parsing |
| CL_Effects.js | 6 KB | Temporary entities, visual effects |
| CL_Light.js | 1 KB | Dynamic light management |
| CL_Net.js | 7 KB | Network communication |

**Load Order** (defined in index.htm):
1. CL.js - Defines CL namespace
2. CL_Core.js - Initializes core state
3. CL_Input.js - Sets up input handling
4. CL_Demo.js - Registers demo commands
5. CL_Parse.js - Registers message parsers
6. CL_Effects.js - Registers effect handlers
7. CL_Light.js - Initializes lighting system
8. CL_Net.js - Initializes networking

All modules operate within the shared `CL` namespace, maintaining backward compatibility while improving code organization and maintainability.

**R.js** - Renderer (73KB, largest module)
- WebGL rendering pipeline
- Visibility culling (frustum, portal visibility)
- BSP tree traversal and rendering
- Model management and rendering
- Particle effects
- Dynamic lighting
- View frustum calculation
- Dependencies: GL, VID (display), Mod (models)

**S.js** - Sound System (23KB)
- Audio playback management
- Spatial audio positioning
- Music and ambient sound handling
- Sound effect queuing and prioritization
- Dependencies: CDAudio

### Graphics & Display Modules

**GL.js** - WebGL Interface (21KB)
- WebGL context initialization
- Shader compilation and management
- Texture loading and binding
- Matrix transformations
- Graphics primitive rendering (meshes, sprites, particles)
- Dependencies: VID (display context), Mod (models)

**VID.js** - Video/Display
- Canvas and WebGL context setup
- Display mode configuration
- Screen resize handling

**Draw.js** - 2D Drawing
- 2D sprite and image rendering
- UI element drawing (crosshair, HUD elements)
- Text rendering for UI
- Dependencies: GL, R

**Sbar.js** - Status Bar (19KB)
- HUD rendering (health, ammo, weapons, scores)
- Status bar layout and updates
- Player status display

**SCR.js** - Screen/UI
- Screen transitions and loading screens
- Console overlay rendering
- Screenshot functionality
- Screen notifications

### Input & Interaction Modules

**IN.js** - Input Handler
- Mouse input capture and processing
- Keyboard input processing
- Input event binding

**Key.js** - Key Binding System (12KB)
- Keyboard command binding
- Key state tracking
- Console key handling
- Customizable controls configuration

**Chase.js** - Chase Camera
- Third-person camera control
- Camera positioning relative to player

### Networking Modules

**NET.js** - Network Abstraction (6KB)
- Generic network interface
- Multiple transport backend support

**NET_WEBS.js** - WebSocket Transport
- WebSocket connection handling
- Message send/receive for multiplayer
- Connection lifecycle management

**NET_Loop.js** - Loopback Network
- Local network for single-player games
- Direct game state communication

**Protocol.js** - Network Protocol
- Protocol version constants and definitions
- Protocol compatibility checks

### Game Logic & Data Modules

**SV.js** - Server Simulation (86KB)
- Single-player game logic
- Physics simulation
- Entity spawning and management
- Command execution
- Scripted game state updates

**M.js** - Menu System (30KB)
- Main menu rendering and navigation
- Settings/options menus
- Game selection and loading

**Mod.js** - Model & Resource Loading (42KB)
- Model loading (sprites, players, monsters)
- BSP map loading
- Texture and animation data loading
- Resource caching
- Dependencies: COM (file operations)

**Console.js** - Console & Commands
- Console UI and history
- Command execution
- Console variable display

### Data Structure & Utility Modules

**MSG.js** - Message Parsing
- Network message encoding/decoding
- Binary data serialization
- Protocol message construction

**SZ.js** - Byte Sized Buffer
- Byte buffer operations
- Bit-level data manipulation

**Cmd.js** - Command Parsing
- Console command parsing and execution
- Command argument processing

**Cvar.js** - Console Variables
- Game configuration variable storage
- Variable lookup and modification
- Variable callbacks

**COM.js** - Common Utilities (12KB)
- File loading and caching
- String utilities
- Data format conversions
- Path handling

**ED.js** - Entity Definition (11KB)
- Entity field definitions
- Entity property parsing
- QuakeC data structure handling

**PR.js** - Program Interpreter (28KB)
- QuakeC VM implementation
- Script execution
- Built-in function calls
- Stack management

**PF.js** - Built-in Functions (25KB)
- QuakeC built-in functions (print, spawn, etc.)
- Vector math operations
- Entity manipulation functions

**Vec.js** - Vector Math
- Vector operations (addition, dot product, cross product)
- Vector utilities

**W.js** - Weapon System
- Weapon switching and firing logic

**V.js** - View/Vision (14KB)
- View angles and camera calculations
- Weapon model positioning
- Camera shake/bobbing effects

**Def.js** - Definitions
- Global constants and type definitions
- Size and limit constants

**Q.js** - Global State
- Global game state variables
- Entity arrays
- Frame timing globals

**CDAudio.js** - CD Audio
- CD music playback (legacy support)
- Music track management

**CRC.js** - Checksum
- CRC calculation for data validation
- Network packet verification

**Sys.js** - System Interface (6KB)
- Error handling
- Debug output
- System time queries

## Data Flow

### Game Loop
```
Host.Frame()
    │
    ├─► IN.ProcessInput()      ──► Cmd (command execution)
    │                              ↓
    ├─► CL_Core.ReadFromServer() ──► CL_Parse (parse messages)
    │                              ↓
    ├─► CL_Input.SendMove()    ──► CL_Net (send commands)
    │                              ↓
    ├─► SV.RunFrame() (single-player) ──► Physics, AI, scripting
    │                                      ↓
    ├─► R.RenderScene()        ──► GL (WebGL rendering)
    │                              ↓
    ├─► S.Update()             ──► Audio output
    │
    └─► SCR/Sbar.Draw()        ──► 2D UI overlay
```

### Network Communication
```
Client Input (IN.js)
    ↓
CL_Input (Queues movement/actions)
    ↓
CL_Net (Sends via network)
    ↓
NET_WEBS (WebSocket)
    ↓
Server
    ↓
NET_WEBS (Receives entity updates)
    ↓
CL_Parse (Parses server messages)
    ↓
CL_Effects/CL_Core (Updates state)
    ↓
R (Renders updated entities)
```

### Rendering Pipeline
```
R.RenderScene()
    ├─► R.SetupFrame()          (view matrix setup)
    ├─► R.MarkLeaves()          (visibility culling)
    ├─► R.DrawWorld()           (BSP rendering)
    │   ├─► Brushes (walls, etc.)
    │   └─► Sprites and models
    ├─► R.DrawEntities()        (monsters, players, items)
    ├─► R.DrawParticles()       (effects)
    ├─► R.DrawDlights()         (dynamic lighting)
    └─► Draw/SCR/Sbar          (2D overlays)
```

## Key Design Patterns

1. **Module Pattern**: Each module is a singleton object with public methods and private state
2. **Global Dependencies**: Modules reference each other globally (see `/* globals: ... */` comments)
3. **Immediate Execution**: All scripts execute immediately on load; order matters
4. **Shared Data**: State is shared between modules through global objects
5. **Binary Protocol**: Network and file data use custom binary formats defined in MSG/SZ

## Resource Types

- **Models**: .mdl files (player models, monsters, weapons)
- **Sprites**: .spr files (effects, temporary visuals)
- **Maps**: .bsp files (world geometry, lighting, visibility)
- **Textures**: Embedded in .bsp files or separate .lmp files
- **Sound**: .wav files (effects)
- **Music**: .ogg files (background music)
- **Configuration**: .cfg files (commands, bindings, server rules)

## Entry Point

1. **index.htm** loads HTML5 canvas and WebGL context
2. Scripts load in dependency order (see index.htm lines 100-145):
   - Core system modules (Host, CL orchestrator)
   - CL sub-modules (Core, Input, Demo, Parse, Effects, Light, Net)
   - Rendering, sound, and utility modules
3. **Host.Initialize()** initializes all subsystems
4. **Host.Main()** starts the main game loop via `requestAnimationFrame`

## Browser APIs Used

- **WebGL**: Graphics rendering (via GL.js)
- **WebSocket**: Network multiplayer (via NET_WEBS.js)
- **Canvas 2D**: UI overlay rendering (via Draw.js)
- **Audio API**: Sound playback (via S.js)
- **FileReader**: Local game file loading
- **Mouse/Keyboard**: Input events (via IN.js, Key.js)

## Performance Considerations

- **Large Modules**: R.js (73KB) and SV.js (86KB) handle compute-heavy tasks
- **Visibility Culling**: Frustum and portal visibility prevent rendering hidden geometry
- **Entity Interpolation**: Smooth motion between network updates
- **Texture Atlasing**: Reduces WebGL state changes
- **Particle Pooling**: Reuses particle objects to reduce allocations
