/**
 * Client module - handles client state, input, server communication, and entity management.
 * Main orchestrator that coordinates all client sub-modules:
 * - CL_Core: Core state and entity management
 * - CL_Input: Input handling
 * - CL_Demo: Demo recording/playback
 * - CL_Parse: Server message parsing
 * - CL_Effects: Temporary entities and effects
 * - CL_Light: Dynamic lighting
 * - CL_Net: Networking
 */
CL = {};
