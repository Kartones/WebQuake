# Scratchpad for Development notes

# General code structure and patterns

- ANSI C code, migrated to (old) JavaScript
- Classes converted to JS objects
  - Singleton objects that maintain shared global state
  - Almost no dependency injection. While the code has a clean Command pattern, object functions have access and use any other instance, e.g. `CDAudio` directly accesses `COM` (I/O), `S` (sound system), `Q` (helpers), `Con` (Console), `Cmd` (available commands) and `Cvar` (console and game state variables).
  - There was no public/private distinction. WIP is prefixing with `_` methods and properties not used outside their module
- Ideally, reach an initial point like in `client/WebQuake/CL_Init.js`: Only global state is the owning module, everything else injected

# Concepts

- Temporary entity: a projectile, explosion, and some effects like the teleport
