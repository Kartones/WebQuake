/* globals: CL */

/**
 * Client module - handles client state, input, server communication, and entity management.
 */
CL = {};

// Core state definitions
CL.cshift = {
  // color shift type: contents
  contents: 0,
  // color shift type: damage
  damage: 1,
  // color shift type: bonus
  bonus: 2,
  // color shift type: powerup
  powerup: 3,
};

CL.active = {
  // connection state: disconnected
  disconnected: 0,
  // connection state: connecting
  connecting: 1,
  // connection state: connected
  connected: 2,
};

// Main client state
CL.cls = {
  // current connection/signon state
  state: 0,
  // spawn parameters passed from server
  spawnparms: "",
  // demo number in sequence
  demonum: 0,
  // message buffer for network communication
  message: {
    // raw message data buffer
    data: new ArrayBuffer(8192),
    // current size of message in bytes
    cursize: 0,
  },
};

// static entities from server that don't move
CL.static_entities = [];
// entities visible in current frame
CL.visedicts = [];

// Input related
CL.kbutton = {
  // key button index: mlook
  mlook: 0,
  // key button index: klook
  klook: 1,
  // key button index: left
  left: 2,
  // key button index: right
  right: 3,
  // key button index: forward
  forward: 4,
  // key button index: back
  back: 5,
  // key button index: lookup
  lookup: 6,
  // key button index: lookdown
  lookdown: 7,
  // key button index: moveleft
  moveleft: 8,
  // key button index: moveright
  moveright: 9,
  // key button index: strafe
  strafe: 10,
  // key button index: speed
  speed: 11,
  // key button index: use
  use: 12,
  // key button index: jump
  jump: 13,
  // key button index: attack
  attack: 14,
  // key button index: moveup
  moveup: 15,
  // key button index: movedown
  movedown: 16,
  // total number of key button types
  num: 17,
};

// button state for each key button type
CL.kbuttons = [];

CL._sendmovebuf = {
  // message buffer for movement data
  data: new ArrayBuffer(16),
  // current size of movement message
  cursize: 0,
};

// Parsing related
CL.svc_strings = [
  "bad",
  "nop",
  "disconnect",
  "updatestat",
  "version",
  "setview",
  "sound",
  "time",
  "print",
  "stufftext",
  "setangle",
  "serverinfo",
  "lightstyle",
  "updatename",
  "updatefrags",
  "clientdata",
  "stopsound",
  "updatecolors",
  "particle",
  "damage",
  "spawnstatic",
  "OBSOLETE spawnbinary",
  "spawnbaseline",
  "temp_entity",
  "setpause",
  "signonnum",
  "centerprint",
  "killedmonster",
  "foundsecret",
  "spawnstaticsound",
  "intermission",
  "finale",
  "cdtrack",
  "sellscreen",
  "cutscene",
];

// time of last keep-alive message sent to server
CL.lastmsg = 0.0;

// Temporary entities ("tent") related
CL.temp_entities = [];
