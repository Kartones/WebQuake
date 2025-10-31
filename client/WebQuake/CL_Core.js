/* globals: CDAudio COM Chase Cmd Con Cvar Host IN MSG Mod NET Protocol Q R S SCR SV Sys V Vec */

/**
 * CL_Core - Core state and entity management.
 * Handles client state initialization, entity management, and server communication.
 */

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

// Main state
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

/**
 * Clear and initialize client state including entities, static state, and temp entities.
 */
CL.ClearState = function () {
  if (SV.server.active !== true) {
    Con.DPrint("Clearing memory\n");
    Mod.ClearAll();
    CL.cls.signon = 0;
  }

  CL.state = {
    // number of received movement messages
    movemessages: 0,
    // player movement command with forward/side/up components
    cmd: {
      // forward movement velocity
      forwardmove: 0.0,
      // side movement velocity
      sidemove: 0.0,
      // up movement velocity
      upmove: 0.0,
    },
    // array of player statistics values
    stats: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ],
    // bitfield of acquired items
    items: 0,
    // timestamp of when each item was picked up
    item_gettime: [
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0, 0.0,
    ],
    // timestamp for face animation
    faceanimtime: 0.0,
    // array of color shifts [contents, damage, bonus, powerup]
    cshifts: [
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
    ],
    // interpolated view angles [previous, current]
    mviewangles: [
      [0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0],
    ],
    // current view angles in degrees
    viewangles: [0.0, 0.0, 0.0],
    // interpolated velocity [previous, current]
    mvelocity: [
      [0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0],
    ],
    // current player velocity
    velocity: [0.0, 0.0, 0.0],
    // current punch angle from damage
    punchangle: [0.0, 0.0, 0.0],
    // ideal pitch angle after damage knockback
    idealpitch: 0.0,
    // pitch angle velocity for drift
    pitchvel: 0.0,
    // drift movement distance
    driftmove: 0.0,
    // last time movement stopped
    laststop: 0.0,
    // crouch state
    crouch: 0.0,
    // intermission state (0=none, 1=intermission, 2=finale, 3=cutscene)
    intermission: 0,
    // time when current level was completed
    completed_time: 0,
    // interpolated time [previous, current]
    mtime: [0.0, 0.0],
    // current server time
    time: 0.0,
    // previous server time
    oldtime: 0.0,
    // timestamp of last received message
    last_received_message: 0.0,
    // entity number for current view
    viewentity: 0,
    // number of static entities
    num_statics: 0,
    // view entity information
    viewent: {
      // entity number (-1 for none)
      num: -1,
      // origin position
      origin: [0.0, 0.0, 0.0],
      // angle orientation
      angles: [0.0, 0.0, 0.0],
      // model skin number
      skinnum: 0,
    },
    // CD audio track to play
    cdtrack: 0,
    // loop track number
    looptrack: 0,
  };

  CL.cls.message.cursize = 0;

  CL.entities = [];

  CL.dlights = [];
  for (let i = 0; i <= 31; ++i) CL.dlights[i] = { radius: 0.0, die: 0.0 };

  CL.lightstyle = [];
  for (let i = 0; i <= 63; ++i) CL.lightstyle[i] = "";

  CL.beams = [];
  for (let i = 0; i <= 23; ++i) CL.beams[i] = { endtime: 0.0 };
};

/**
 * LerpPoint function.
 */
CL.LerpPoint = function () {
  let f = CL.state.mtime[0] - CL.state.mtime[1];
  if (
    f === 0.0 ||
    CL.nolerp.value !== 0 ||
    CL.cls.timedemo === true ||
    SV.server.active === true
  ) {
    CL.state.time = CL.state.mtime[0];
    return 1.0;
  }
  if (f > 0.1) {
    CL.state.mtime[1] = CL.state.mtime[0] - 0.1;
    f = 0.1;
  }
  let frac = (CL.state.time - CL.state.mtime[1]) / f;
  if (frac < 0.0) {
    if (frac < -0.01) CL.state.time = CL.state.mtime[1];
    return 0.0;
  }
  if (frac > 1.0) {
    if (frac > 1.01) CL.state.time = CL.state.mtime[0];
    return 1.0;
  }
  return frac;
};

/**
 * Update entity positions based on interpolation.
 */
CL.RelinkEntities = function () {
  let i, j;
  let frac = CL.LerpPoint(),
    f,
    d,
    delta = [];

  CL.numvisedicts = 0;

  CL.state.velocity[0] =
    CL.state.mvelocity[1][0] +
    frac * (CL.state.mvelocity[0][0] - CL.state.mvelocity[1][0]);
  CL.state.velocity[1] =
    CL.state.mvelocity[1][1] +
    frac * (CL.state.mvelocity[0][1] - CL.state.mvelocity[1][1]);
  CL.state.velocity[2] =
    CL.state.mvelocity[1][2] +
    frac * (CL.state.mvelocity[0][2] - CL.state.mvelocity[1][2]);

  if (CL.cls.demoplayback === true) {
    for (i = 0; i <= 2; ++i) {
      d = CL.state.mviewangles[0][i] - CL.state.mviewangles[1][i];
      if (d > 180.0) d -= 360.0;
      else if (d < -180.0) d += 360.0;
      CL.state.viewangles[i] = CL.state.mviewangles[1][i] + frac * d;
    }
  }

  let bobjrotate = ClientVec.Anglemod(100.0 * CL.state.time);
  let ent,
    oldorg = [],
    dl;
  for (i = 1; i < CL.entities.length; ++i) {
    ent = CL.entities[i];
    if (ent.model == null) continue;
    if (ent.msgtime !== CL.state.mtime[0]) {
      ent.model = null;
      continue;
    }
    oldorg[0] = ent.origin[0];
    oldorg[1] = ent.origin[1];
    oldorg[2] = ent.origin[2];
    if (ent.forcelink === true) {
      ClientVec.Copy(ent.msg_origins[0], ent.origin);
      ClientVec.Copy(ent.msg_angles[0], ent.angles);
    } else {
      f = frac;
      for (j = 0; j <= 2; ++j) {
        delta[j] = ent.msg_origins[0][j] - ent.msg_origins[1][j];
        if (delta[j] > 100.0 || delta[j] < -100.0) f = 1.0;
      }
      for (j = 0; j <= 2; ++j) {
        ent.origin[j] = ent.msg_origins[1][j] + f * delta[j];
        d = ent.msg_angles[0][j] - ent.msg_angles[1][j];
        if (d > 180.0) d -= 360.0;
        else if (d < -180.0) d += 360.0;
        ent.angles[j] = ent.msg_angles[1][j] + f * d;
      }
    }

    if ((ent.model.flags & Mod.flags.rotate) !== 0) ent.angles[1] = bobjrotate;
    if ((ent.effects & Mod.effects.brightfield) !== 0) R.EntityParticles(ent);
    if ((ent.effects & Mod.effects.muzzleflash) !== 0) {
      dl = CL.AllocDlight(i);
      let fv = [];
      ClientVec.AngleVectors(ent.angles, fv);
      dl.origin = [
        ent.origin[0] + 18.0 * fv[0],
        ent.origin[1] + 18.0 * fv[1],
        ent.origin[2] + 16.0 + 18.0 * fv[2],
      ];
      dl.radius = 200.0 + Math.random() * 32.0;
      dl.minlight = 32.0;
      dl.die = CL.state.time + 0.1;
    }
    if ((ent.effects & Mod.effects.brightlight) !== 0) {
      dl = CL.AllocDlight(i);
      dl.origin = [ent.origin[0], ent.origin[1], ent.origin[2] + 16.0];
      dl.radius = 400.0 + Math.random() * 32.0;
      dl.die = CL.state.time + 0.001;
    }
    if ((ent.effects & Mod.effects.dimlight) !== 0) {
      dl = CL.AllocDlight(i);
      dl.origin = [ent.origin[0], ent.origin[1], ent.origin[2] + 16.0];
      dl.radius = 200.0 + Math.random() * 32.0;
      dl.die = CL.state.time + 0.001;
    }
    if ((ent.model.flags & Mod.flags.gib) !== 0)
      R.RocketTrail(oldorg, ent.origin, 2);
    else if ((ent.model.flags & Mod.flags.zomgib) !== 0)
      R.RocketTrail(oldorg, ent.origin, 4);
    else if ((ent.model.flags & Mod.flags.tracer) !== 0)
      R.RocketTrail(oldorg, ent.origin, 3);
    else if ((ent.model.flags & Mod.flags.tracer2) !== 0)
      R.RocketTrail(oldorg, ent.origin, 5);
    else if ((ent.model.flags & Mod.flags.rocket) !== 0) {
      R.RocketTrail(oldorg, ent.origin, 0);
      dl = CL.AllocDlight(i);
      dl.origin = [ent.origin[0], ent.origin[1], ent.origin[2]];
      dl.radius = 200.0;
      dl.die = CL.state.time + 0.01;
    } else if ((ent.model.flags & Mod.flags.grenade) !== 0)
      R.RocketTrail(oldorg, ent.origin, 1);
    else if ((ent.model.flags & Mod.flags.tracer3) !== 0)
      R.RocketTrail(oldorg, ent.origin, 6);

    ent.forcelink = false;
    if (i !== CL.state.viewentity || Chase.active.value !== 0)
      CL.visedicts[CL.numvisedicts++] = ent;
  }
};

/**
 * Read and process messages from server.
 */
CL.ReadFromServer = function () {
  CL.state.oldtime = CL.state.time;
  CL.state.time += Host.frametime;
  for (let ret; ; ) {
    ret = CL.GetMessage();
    if (ret === -1) Host.Error("CL.ReadFromServer: lost server connection");
    if (ret === 0) break;
    CL.state.last_received_message = Host.realtime;
    CL.ParseServerMessage();
    if (CL.cls.state !== CL.active.connected) break;
  }
  if (CL.shownet.value !== 0) Con.Print("\n");
  CL.RelinkEntities();
  CL.UpdateTEnts();
};

/**
 * Return an entity structure by its number, allocating it if necessary.
 * @param {number} num - The entity number.
 * @returns {object} The entity object.
 */
CL.EntityNum = function (num) {
  if (num < CL.entities.length) return CL.entities[num];
  for (; CL.entities.length <= num; ) {
    CL.entities[CL.entities.length] = {
      // entity index number
      num: num,
      // type of update for this entity
      update_type: 0,
      // baseline state from server
      baseline: {
        // origin position
        origin: [0.0, 0.0, 0.0],
        // angle orientation
        angles: [0.0, 0.0, 0.0],
        // model index
        modelindex: 0,
        // animation frame
        frame: 0,
        // player color mapping
        colormap: 0,
        // model skin number
        skin: 0,
        // visual effects flags
        effects: 0,
      },
      // timestamp of last message for this entity
      msgtime: 0.0,
      // interpolated origin positions [current, previous]
      msg_origins: [
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
      ],
      // current world position
      origin: [0.0, 0.0, 0.0],
      // interpolated angle orientations [current, previous]
      msg_angles: [
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
      ],
      // current angles
      angles: [0.0, 0.0, 0.0],
      // animation frame index
      frame: 0,
      // animation synchronization base for random frame offset
      syncbase: 0.0,
      // visual effects flags
      effects: 0,
      // skin number for model
      skinnum: 0,
      // current vis frame for visibility culling
      visframe: 0,
      // frame for dynamic light culling
      dlightframe: 0,
      // bitfield for dynamic lights affecting entity
      dlightbits: 0,
    };
  }
  return CL.entities[num];
};

/**
 * Play next demo in sequence.
 */
CL.NextDemo = function () {
  if (CL.cls.demonum === -1) return;
  SCR.BeginLoadingPlaque();
  if (CL.cls.demonum >= CL.cls.demos.length) {
    if (CL.cls.demos.length === 0) {
      Con.Print("No demos listed with startdemos\n");
      CL.cls.demonum = -1;
      return;
    }
    CL.cls.demonum = 0;
  }
  Cmd.text = "playdemo " + CL.cls.demos[CL.cls.demonum++] + "\n" + Cmd.text;
};

/**
 * Print information about entities for debugging.
 */
CL.PrintEntities_f = function () {
  let i, ent;
  for (i = 0; i < CL.entities.length; ++i) {
    ent = CL.entities[i];
    if (i <= 9) Con.Print("  " + i + ":");
    else if (i <= 99) Con.Print(" " + i + ":");
    else Con.Print(i + ":");
    if (ent.model == null) {
      Con.Print("EMPTY\n");
      continue;
    }
    Con.Print(
      ent.model.name +
        (ent.frame <= 9 ? ": " : ":") +
        ent.frame +
        "  (" +
        ent.origin[0].toFixed(1) +
        "," +
        ent.origin[1].toFixed(1) +
        "," +
        ent.origin[2].toFixed(1) +
        ") [" +
        ent.angles[0].toFixed(1) +
        " " +
        ent.angles[1].toFixed(1) +
        " " +
        ent.angles[2].toFixed(1) +
        "]\n"
    );
  }
};

/**
 * Initialize the client module.
 */
CL.Init = function () {
  CL.ClearState();
  CL.InitInput();
  CL.InitTEnts();
  CL.name = Cvar.RegisterVariable("_cl_name", "player", true);
  CL.color = Cvar.RegisterVariable("_cl_color", "0", true);
  CL.upspeed = Cvar.RegisterVariable("cl_upspeed", "200");
  CL.forwardspeed = Cvar.RegisterVariable("cl_forwardspeed", "200", true);
  CL.backspeed = Cvar.RegisterVariable("cl_backspeed", "200", true);
  CL.sidespeed = Cvar.RegisterVariable("cl_sidespeed", "350");
  CL.movespeedkey = Cvar.RegisterVariable("cl_movespeedkey", "2.0");
  CL.yawspeed = Cvar.RegisterVariable("cl_yawspeed", "140");
  CL.pitchspeed = Cvar.RegisterVariable("cl_pitchspeed", "150");
  CL.anglespeedkey = Cvar.RegisterVariable("cl_anglespeedkey", "1.5");
  CL.shownet = Cvar.RegisterVariable("cl_shownet", "0");
  CL.nolerp = Cvar.RegisterVariable("cl_nolerp", "0");
  CL.lookspring = Cvar.RegisterVariable("lookspring", "0", true);
  CL.lookstrafe = Cvar.RegisterVariable("lookstrafe", "0", true);
  CL.sensitivity = Cvar.RegisterVariable("sensitivity", "3", true);
  CL.m_pitch = Cvar.RegisterVariable("m_pitch", "0.022", true);
  CL.m_yaw = Cvar.RegisterVariable("m_yaw", "0.022", true);
  CL.m_forward = Cvar.RegisterVariable("m_forward", "1", true);
  CL.m_side = Cvar.RegisterVariable("m_side", "0.8", true);
  CL.rcon_password = Cvar.RegisterVariable("rcon_password", "");
  CL.rcon_address = Cvar.RegisterVariable("rcon_address", "");
  Cmd.AddCommand("entities", CL.PrintEntities_f);
  Cmd.AddCommand("disconnect", CL.Disconnect);
  Cmd.AddCommand("record", CL.Record_f);
  Cmd.AddCommand("stop", CL.Stop_f);
  Cmd.AddCommand("playdemo", CL.PlayDemo_f);
  Cmd.AddCommand("timedemo", CL.TimeDemo_f);
  Cmd.AddCommand("rcon", CL.Rcon_f);
};
