/* globals: Cmd Con CL Host IN V */

/**
 * CL_Input - Input handling for keyboard and mouse.
 * Manages key binding, input state, and movement command generation.
 */

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

CL.sendmovebuf = {
  // message buffer for movement data
  data: new ArrayBuffer(16),
  // current size of movement message
  cursize: 0,
};

/**
 * Handle key press for client input.
 */
CL.KeyDown = function () {
  let b = CL.kbutton[Cmd.argv[0].substring(1)];
  if (b == null) return;
  b = CL.kbuttons[b];

  let k;
  if (Cmd.argv[1] != null) k = Q.atoi(Cmd.argv[1]);
  else k = -1;

  if (k === b.down[0] || k === b.down[1]) return;

  if (b.down[0] === 0) b.down[0] = k;
  else if (b.down[1] === 0) b.down[1] = k;
  else {
    Con.Print("Three keys down for a button!\n");
    return;
  }

  if ((b.state & 1) === 0) b.state |= 3;
};

/**
 * Handle key release for client input.
 */
CL.KeyUp = function () {
  let b = CL.kbutton[Cmd.argv[0].substring(1)];
  if (b == null) return;
  b = CL.kbuttons[b];

  let k;
  if (Cmd.argv[1] != null) k = Q.atoi(Cmd.argv[1]);
  else {
    b.down[0] = b.down[1] = 0;
    b.state = 4;
    return;
  }

  if (b.down[0] === k) b.down[0] = 0;
  else if (b.down[1] === k) b.down[1] = 0;
  else return;
  if (b.down[0] !== 0 || b.down[1] !== 0) return;

  if ((b.state & 1) !== 0) b.state = (b.state - 1) | 4;
};

/**
 * Handle mouse look release.
 */
CL.MLookUp = function () {
  CL.KeyUp();
  if (
    (CL.kbuttons[CL.kbutton.mlook].state & 1) === 0 &&
    CL.lookspring.value !== 0
  )
    V.StartPitchDrift();
};

/**
 * Process client impulse command.
 */
CL.Impulse = function () {
  CL.impulse = Q.atoi(Cmd.argv[1]);
};

/**
 * Get the current state of a key button.
 * @param {number} key - The key index.
 * @returns {number} The key state value.
 */
CL.KeyState = function (key) {
  key = CL.kbuttons[key];
  let down = key.state & 1;
  key.state &= 1;
  if ((key.state & 2) !== 0) {
    if ((key.state & 4) !== 0) return down !== 0 ? 0.75 : 0.25;
    return down !== 0 ? 0.5 : 0.0;
  }
  if ((key.state & 4) !== 0) return 0.0;
  return down !== 0 ? 1.0 : 0.0;
};

/**
 * Adjust view angles based on input.
 */
CL.AdjustAngles = function () {
  let speed = Host.frametime;
  if ((CL.kbuttons[CL.kbutton.speed].state & 1) !== 0)
    speed *= CL.anglespeedkey.value;

  let angles = CL.state.viewangles;

  if ((CL.kbuttons[CL.kbutton.strafe].state & 1) === 0) {
    angles[1] +=
      speed *
      CL.yawspeed.value *
      (CL.KeyState(CL.kbutton.left) - CL.KeyState(CL.kbutton.right));
    angles[1] = ClientVec.Anglemod(angles[1]);
  }
  if ((CL.kbuttons[CL.kbutton.klook].state & 1) !== 0) {
    V.StopPitchDrift();
    angles[0] +=
      speed *
      CL.pitchspeed.value *
      (CL.KeyState(CL.kbutton.back) - CL.KeyState(CL.kbutton.forward));
  }

  let up = CL.KeyState(CL.kbutton.lookup),
    down = CL.KeyState(CL.kbutton.lookdown);
  if (up !== 0.0 || down !== 0.0) {
    angles[0] += speed * CL.pitchspeed.value * (down - up);
    V.StopPitchDrift();
  }

  if (angles[0] > 80.0) angles[0] = 80.0;
  else if (angles[0] < -70.0) angles[0] = -70.0;

  if (angles[2] > 50.0) angles[2] = 50.0;
  else if (angles[2] < -50.0) angles[2] = -50.0;
};

/**
 * Calculate base movement velocity from input.
 */
CL.BaseMove = function () {
  if (CL.cls.signon !== 4) return;

  CL.AdjustAngles();

  let cmd = CL.state.cmd;

  cmd.sidemove =
    CL.sidespeed.value *
    (CL.KeyState(CL.kbutton.moveright) - CL.KeyState(CL.kbutton.moveleft));
  if ((CL.kbuttons[CL.kbutton.strafe].state & 1) !== 0)
    cmd.sidemove +=
      CL.sidespeed.value *
      (CL.KeyState(CL.kbutton.right) - CL.KeyState(CL.kbutton.left));

  cmd.upmove =
    CL.upspeed.value *
    (CL.KeyState(CL.kbutton.moveup) - CL.KeyState(CL.kbutton.movedown));

  if ((CL.kbuttons[CL.kbutton.klook].state & 1) === 0)
    cmd.forwardmove =
      CL.forwardspeed.value * CL.KeyState(CL.kbutton.forward) -
      CL.backspeed.value * CL.KeyState(CL.kbutton.back);
  else cmd.forwardmove = 0.0;

  if ((CL.kbuttons[CL.kbutton.speed].state & 1) !== 0) {
    cmd.forwardmove *= CL.movespeedkey.value;
    cmd.sidemove *= CL.movespeedkey.value;
    cmd.upmove *= CL.movespeedkey.value;
  }
};

/**
 * Sends a movement command through the network
 */
CL.SendMove = function () {
  let messageBuffer = CL.sendmovebuf;
  messageBuffer.cursize = 0;

  MSG.WriteByte(messageBuffer, Protocol.clc.move);
  MSG.WriteFloat(messageBuffer, CL.state.mtime[0]);
  MSG.WriteAngle(messageBuffer, CL.state.viewangles[0]);
  MSG.WriteAngle(messageBuffer, CL.state.viewangles[1]);
  MSG.WriteAngle(messageBuffer, CL.state.viewangles[2]);
  MSG.WriteShort(messageBuffer, CL.state.cmd.forwardmove);
  MSG.WriteShort(messageBuffer, CL.state.cmd.sidemove);
  MSG.WriteShort(messageBuffer, CL.state.cmd.upmove);

  let bits = 0;
  if ((CL.kbuttons[CL.kbutton.attack].state & 3) !== 0) bits += 1;
  CL.kbuttons[CL.kbutton.attack].state &= 5;
  if ((CL.kbuttons[CL.kbutton.jump].state & 3) !== 0) bits += 2;
  CL.kbuttons[CL.kbutton.jump].state &= 5;
  MSG.WriteByte(messageBuffer, bits);

  MSG.WriteByte(messageBuffer, CL.impulse);
  CL.impulse = 0;

  if (CL.cls.demoplayback === true) {
    return;
  }
  if (++CL.state.movemessages <= 2) {
    return;
  }

  const returnCode = NET.SendUnreliableMessage(CL.cls.netcon, messageBuffer);
  if (returnCode === -1) {
    Con.Print("CL.SendMove: lost server connection\n");
    CL.Disconnect();
  }
};

/**
 * Initialize client input subsystem.
 */
CL.InitInput = function () {
  let i;

  const commands = [
    "moveup",
    "movedown",
    "left",
    "right",
    "forward",
    "back",
    "lookup",
    "lookdown",
    "strafe",
    "moveleft",
    "moveright",
    "speed",
    "attack",
    "use",
    "jump",
    "klook",
  ];
  for (i = 0; i < commands.length; ++i) {
    Cmd.AddCommand("+" + commands[i], CL.KeyDown);
    Cmd.AddCommand("-" + commands[i], CL.KeyUp);
  }
  Cmd.AddCommand("impulse", CL.Impulse);
  Cmd.AddCommand("+mlook", CL.KeyDown);
  Cmd.AddCommand("-mlook", CL.MLookUp);

  for (i = 0; i < CL.kbutton.num; ++i)
    CL.kbuttons[i] = {
      // array of two keys that trigger this button
      down: [0, 0],
      // current button state (bit flags for active, pressed, released)
      state: 0,
    };
};
