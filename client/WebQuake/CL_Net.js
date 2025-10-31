/* globals: Cmd Con CL COM Host MSG NET Protocol Q R S SCR SV Sys */

/**
 * CL_Net - Network communication.
 * Handles connection, disconnection, remote console, and keepalive messages.
 */

/**
 * Read and parse a message from the server or demo file.
 * @returns {number} The number of bytes read, or 0 if no message available.
 */
CL.GetMessage = function () {
  if (CL.cls.demoplayback === true) {
    if (CL.cls.signon === 4) {
      if (CL.cls.timedemo === true) {
        if (Host.framecount === CL.cls.td_lastframe) return 0;
        CL.cls.td_lastframe = Host.framecount;
        if (Host.framecount === CL.cls.td_startframe + 1)
          CL.cls.td_starttime = Host.realtime;
      } else if (CL.state.time <= CL.state.mtime[0]) return 0;
    }
    if (CL.cls.demoofs + 16 >= CL.cls.demosize) {
      CL.StopPlayback();
      return 0;
    }
    let view = new DataView(CL.cls.demofile);
    NET.message.cursize = view.getUint32(CL.cls.demoofs, true);
    if (NET.message.cursize > 8000) Sys.Error("Demo message > MAX_MSGLEN");
    CL.state.mviewangles[1] = CL.state.mviewangles[0];
    CL.state.mviewangles[0] = [
      view.getFloat32(CL.cls.demoofs + 4, true),
      view.getFloat32(CL.cls.demoofs + 8, true),
      view.getFloat32(CL.cls.demoofs + 12, true),
    ];
    CL.cls.demoofs += 16;
    if (CL.cls.demoofs + NET.message.cursize > CL.cls.demosize) {
      CL.StopPlayback();
      return 0;
    }
    let src = new Uint8Array(
      CL.cls.demofile,
      CL.cls.demoofs,
      NET.message.cursize
    );
    let dest = new Uint8Array(NET.message.data, 0, NET.message.cursize);
    let i;
    for (i = 0; i < NET.message.cursize; ++i) dest[i] = src[i];
    CL.cls.demoofs += NET.message.cursize;
    return 1;
  }

  let r;
  for (;;) {
    r = NET.GetMessage(CL.cls.netcon);
    if (r !== 1 && r !== 2) return r;
    if (
      NET.message.cursize === 1 &&
      new Uint8Array(NET.message.data, 0, 1)[0] === Protocol.svc.nop
    )
      Con.Print("<-- server to client keepalive\n");
    else break;
  }

  if (CL.cls.demorecording === true) CL.WriteDemoMessage();

  return r;
};

/**
 * Execute remote console command.
 */
CL.Rcon_f = function () {
  if (CL.rcon_password.string.length === 0) {
    Con.Print(
      "You must set 'rcon_password' before\nissuing an rcon command.\n"
    );
    return;
  }
  let to;
  if (CL.cls.state === CL.active.connected && CL.cls.netcon != null) {
    if (NET.drivers[CL.cls.netcon.driver] === WEBS)
      to = CL.cls.netcon.address.substring(5);
  }
  if (to == null) {
    if (CL.rcon_address.string.length === 0) {
      Con.Print(
        "You must either be connected,\nor set the 'rcon_address' cvar\nto issue rcon commands\n"
      );
      return;
    }
    to = CL.rcon_address.string;
  }
  let pw;
  try {
    pw = btoa("quake:" + CL.rcon_password.string);
  } catch (e) {
    return;
  }
  let message = "",
    i;
  for (i = 1; i < Cmd.argv.length; ++i) message += Cmd.argv[i] + " ";
  try {
    message = encodeURIComponent(message);
  } catch (e) {
    return;
  }
  let xhr = new XMLHttpRequest();
  xhr.open("HEAD", "http://" + to + "/rcon/" + message);
  xhr.setRequestHeader("Authorization", "Basic " + pw);
  xhr.send();
};

/**
 * Disconnect from server and stop playback.
 */
CL.Disconnect = function () {
  S.StopAllSounds();
  if (CL.cls.demoplayback === true) CL.StopPlayback();
  else if (CL.cls.state === CL.active.connected) {
    if (CL.cls.demorecording === true) CL.Stop_f();
    Con.DPrint("Sending clc_disconnect\n");
    CL.cls.message.cursize = 0;
    MSG.WriteByte(CL.cls.message, Protocol.clc.disconnect);
    NET.SendUnreliableMessage(CL.cls.netcon, CL.cls.message);
    CL.cls.message.cursize = 0;
    NET.Close(CL.cls.netcon);
    CL.cls.state = CL.active.disconnected;
    if (SV.server.active === true) Host.ShutdownServer();
  }
  CL.cls.demoplayback = CL.cls.timedemo = false;
  CL.cls.signon = 0;
};

/**
 * Connect to a server.
 * @param {*} sock - The socket/connection handle.
 */
CL.Connect = function (sock) {
  CL.cls.netcon = sock;
  Con.DPrint("CL.Connect: connected to " + CL.host + "\n");
  CL.cls.demonum = -1;
  CL.cls.state = CL.active.connected;
  CL.cls.signon = 0;
};

/**
 * Establish connection to a server.
 * @param {string} host - Server hostname or address.
 */
CL.EstablishConnection = function (host) {
  if (CL.cls.demoplayback === true) return;
  CL.Disconnect();
  CL.host = host;
  let sock = NET.Connect(host);
  if (sock == null) Host.Error("CL.EstablishConnection: connect failed\n");
  CL.Connect(sock);
};

/**
 * Handle server signon reply during connection handshake.
 */
CL.SignonReply = function () {
  Con.DPrint("CL.SignonReply: " + CL.cls.signon + "\n");
  switch (CL.cls.signon) {
    case 1:
      MSG.WriteByte(CL.cls.message, Protocol.clc.stringcmd);
      MSG.WriteString(CL.cls.message, "prespawn");
      return;
    case 2:
      MSG.WriteByte(CL.cls.message, Protocol.clc.stringcmd);
      MSG.WriteString(CL.cls.message, 'name "' + CL.name.string + '"\n');
      MSG.WriteByte(CL.cls.message, Protocol.clc.stringcmd);
      MSG.WriteString(
        CL.cls.message,
        "color " + (CL.color.value >> 4) + " " + (CL.color.value & 15) + "\n"
      );
      MSG.WriteByte(CL.cls.message, Protocol.clc.stringcmd);
      MSG.WriteString(CL.cls.message, "spawn " + CL.cls.spawnparms);
      return;
    case 3:
      MSG.WriteByte(CL.cls.message, Protocol.clc.stringcmd);
      MSG.WriteString(CL.cls.message, "begin");
      return;
    case 4:
      SCR.EndLoadingPlaque();
  }
};

/**
 * Send keepalive message to prevent timeout.
 */
CL.KeepaliveMessage = function () {
  if (SV.server.active === true || CL.cls.demoplayback === true) return;
  let oldsize = NET.message.cursize;
  let olddata = new Uint8Array(8192);
  olddata.set(new Uint8Array(NET.message.data, 0, oldsize));
  let ret;
  for (;;) {
    ret = CL.GetMessage();
    switch (ret) {
      case 0:
        break;
      case 1:
        Host.Error("CL.KeepaliveMessage: received a message");
      case 2:
        if (MSG.ReadByte() !== Protocol.svc.nop)
          Host.Error("CL.KeepaliveMessage: datagram wasn't a nop");
      default:
        Host.Error("CL.KeepaliveMessage: CL.GetMessage failed");
    }
    if (ret === 0) break;
  }
  NET.message.cursize = oldsize;
  new Uint8Array(NET.message.data, 0, oldsize).set(
    olddata.subarray(0, oldsize)
  );
  let time = Sys.FloatTime();
  if (time - CL.lastmsg < 5.0) return;
  CL.lastmsg = time;
  Con.Print("--> client to server keepalive\n");
  MSG.WriteByte(CL.cls.message, Protocol.clc.nop);
  NET.SendMessage(CL.cls.netcon, CL.cls.message);
  CL.cls.message.cursize = 0;
};

/**
 * Sends a movement command (mouse & keyboard)
 */
CL.SendCmd = function () {
  if (CL.cls.state !== CL.active.connected) return;

  if (CL.cls.signon === 4) {
    CL.BaseMove();
    IN.Move();
    CL.SendMove();
  }

  if (CL.cls.demoplayback === true) {
    CL.cls.message.cursize = 0;
    return;
  }

  if (CL.cls.message.cursize === 0) return;

  if (NET.CanSendMessage(CL.cls.netcon) !== true) {
    Con.DPrint("CL.SendCmd: can't send\n");
    return;
  }

  if (NET.SendMessage(CL.cls.netcon, CL.cls.message) === -1)
    Host.Error("CL.SendCmd: lost server connection");

  CL.cls.message.cursize = 0;
};
