/* globals: Protocol */

/**
 * Network protocol constants and message types for client-server communication.
 */
Protocol = {};

// network protocol version number
Protocol.version = 15;

Protocol.u = {
  // indicates there are more update bits following
  morebits: 1,
  // x coordinate of entity origin
  origin1: 1 << 1,
  // y coordinate of entity origin
  origin2: 1 << 2,
  // z coordinate of entity origin
  origin3: 1 << 3,
  // yaw rotation angle
  angle2: 1 << 4,
  // disable linear interpolation
  nolerp: 1 << 5,
  // entity animation frame number
  frame: 1 << 6,
  // signal/state flag
  signal: 1 << 7,

  // pitch rotation angle
  angle1: 1 << 8,
  // roll rotation angle
  angle3: 1 << 9,
  // entity model index
  model: 1 << 10,
  // color map translation
  colormap: 1 << 11,
  // skin texture index
  skin: 1 << 12,
  // entity visual effects flags
  effects: 1 << 13,
  // use long entity number format
  longentity: 1 << 14,
};

Protocol.su = {
  // player view height from origin
  viewheight: 1,
  // ideal pitch angle for auto-aim
  idealpitch: 1 << 1,
  // punch effect x component
  punch1: 1 << 2,
  // punch effect y component
  punch2: 1 << 3,
  // punch effect z component
  punch3: 1 << 4,
  // velocity x component
  velocity1: 1 << 5,
  // velocity y component
  velocity2: 1 << 6,
  // velocity z component
  velocity3: 1 << 7,
  // inventory items bitfield
  items: 1 << 9,
  // whether player is on ground
  onground: 1 << 10,
  // whether player is in water/liquid
  inwater: 1 << 11,
  // current weapon animation frame
  weaponframe: 1 << 12,
  // player armor value
  armor: 1 << 13,
  // currently equipped weapon index
  weapon: 1 << 14,
};

// default view height from origin
Protocol.default_viewheight = 22;

Protocol.svc = {
  // no operation/keep-alive message
  nop: 1,
  // client disconnect signal
  disconnect: 2,
  // player stat update
  updatestat: 3,
  // protocol version verification
  version: 4,
  // set player viewpoint entity
  setview: 5,
  // play sound effect
  sound: 6,
  // current server time
  time: 7,
  // text message to display
  print: 8,
  // execute console command on client
  stufftext: 9,
  // set player viewing angles
  setangle: 10,
  // server configuration info
  serverinfo: 11,
  // light style animation pattern
  lightstyle: 12,
  // update player name string
  updatename: 13,
  // update player fragging scores
  updatefrags: 14,
  // player data snapshot
  clientdata: 15,
  // stop sound effect
  stopsound: 16,
  // update player colors/skins
  updatecolors: 17,
  // particle effect spawning
  particle: 18,
  // damage screen effect
  damage: 19,
  // spawn static entity
  spawnstatic: 20,
  // spawn baseline entity state
  spawnbaseline: 22,
  // temporary visual effect
  temp_entity: 23,
  // set game paused state
  setpause: 24,
  // signon progression stage
  signonnum: 25,
  // display centered text
  centerprint: 26,
  // monster kill counter update
  killedmonster: 27,
  // secret found counter update
  foundsecret: 28,
  // spawn sound at location
  spawnstaticsound: 29,
  // intermission screen
  intermission: 30,
  // end level sequence
  finale: 31,
  // cd audio track number
  cdtrack: 32,
  // show sell/quit screen
  sellscreen: 33,
  // cutscene video
  cutscene: 34,
};

Protocol.clc = {
  // keep-alive packet
  nop: 1,
  // client disconnect request
  disconnect: 2,
  // player movement input
  move: 3,
  // console command execution
  stringcmd: 4,
};

Protocol.te = {
  // nail spike impact
  spike: 0,
  // super nail spike impact
  superspike: 1,
  // gunshot/bullet impact
  gunshot: 2,
  // explosion effect
  explosion: 3,
  // tar pit explosion
  tarexplosion: 4,
  // first lightning bolt
  lightning1: 5,
  // second lightning bolt
  lightning2: 6,
  // wizard spike effect
  wizspike: 7,
  // knight spike effect
  knightspike: 8,
  // third lightning bolt
  lightning3: 9,
  // lava splash effect
  lavasplash: 10,
  // teleport/telefragger effect
  teleport: 11,
  // alternate explosion effect
  explosion2: 12,
  // beam effect
  beam: 13,
};
