# Scratchpad for Development notes

# General code structure and patterns

- ANSI C code, migrated to (old) JavaScript
- Classes converted to JS objects
  - Singleton objects, with a shared global state
  - Almost no dependency injection. While the code has a clean Command pattern, object functions have access and use any other instance, e.g. `CDAudio` directly accesses `COM` (I/O), `S` (sound system), `Q` (helpers), `Con` (Console), `Cmd` (available commands) and `Cvar` (console and game state variables).

# Concepts

- Temporary entity: a projectile, explosion, and some effects like the teleport
