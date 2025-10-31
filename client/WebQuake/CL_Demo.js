/* globals: Cmd COM Con Host MSG NET Protocol Q SCR SV Sys */

/**
 * CL_Demo - Demo recording and playback.
 * Handles recording demos, playing back demos, and timed demo benchmarking.
 */

/**
 * Stop demo playback.
 */
CL.StopPlayback = function () {
  if (CL.cls.demoplayback !== true) return;
  CL.cls.demoplayback = false;
  CL.cls.demofile = null;
  CL.cls.state = CL.active.disconnected;
  if (CL.cls.timedemo === true) CL.FinishTimeDemo();
};

/**
 * Write the current network message to the demo file with view angles.
 */
CL.WriteDemoMessage = function () {
  let len = CL.cls.demoofs + 16 + NET.message.cursize;
  if (CL.cls.demofile.byteLength < len) {
    let src = new Uint8Array(CL.cls.demofile, 0, CL.cls.demoofs);
    CL.cls.demofile = new ArrayBuffer(CL.cls.demofile.byteLength + 16384);
    new Uint8Array(CL.cls.demofile).set(src);
  }
  let f = new DataView(CL.cls.demofile, CL.cls.demoofs, 16);
  f.setInt32(0, NET.message.cursize, true);
  f.setFloat32(4, CL.state.viewangles[0], true);
  f.setFloat32(8, CL.state.viewangles[1], true);
  f.setFloat32(12, CL.state.viewangles[2], true);
  new Uint8Array(CL.cls.demofile).set(
    new Uint8Array(NET.message.data, 0, NET.message.cursize),
    CL.cls.demoofs + 16
  );
  CL.cls.demoofs = len;
};

/**
 * Stop demo recording.
 */
CL.Stop_f = function () {
  if (Cmd.client === true) return;
  if (CL.cls.demorecording !== true) {
    Con.Print("Not recording a demo.\n");
    return;
  }
  NET.message.cursize = 0;
  MSG.WriteByte(NET.message, Protocol.svc.disconnect);
  CL.WriteDemoMessage();
  if (
    COM.WriteFile(
      CL.cls.demoname,
      new Uint8Array(CL.cls.demofile),
      CL.cls.demoofs
    ) !== true
  )
    Con.Print("ERROR: couldn't open.\n");
  CL.cls.demofile = null;
  CL.cls.demorecording = false;
  Con.Print("Completed demo\n");
};

/**
 * Start recording a demo.
 */
CL.Record_f = function () {
  let c = Cmd.argv.length;
  if (c <= 1 || c >= 5) {
    Con.Print("record <demoname> [<map> [cd track]]\n");
    return;
  }
  if (Cmd.argv[1].indexOf("..") !== -1) {
    Con.Print("Relative pathnames are not allowed.\n");
    return;
  }
  if (c === 2 && CL.cls.state === CL.active.connected) {
    Con.Print(
      "Can not record - already connected to server\nClient demo recording must be started before connecting\n"
    );
    return;
  }
  if (c === 4) {
    CL.cls.forcetrack = Q.atoi(Cmd.argv[3]);
    Con.Print("Forcing CD track to " + CL.cls.forcetrack);
  } else CL.cls.forcetrack = -1;
  CL.cls.demoname = COM.DefaultExtension(Cmd.argv[1], ".dem");
  if (c >= 3) Cmd.ExecuteString("map " + Cmd.argv[2]);
  Con.Print("recording to " + CL.cls.demoname + ".\n");
  CL.cls.demofile = new ArrayBuffer(16384);
  let track = CL.cls.forcetrack.toString() + "\n";
  let i,
    dest = new Uint8Array(CL.cls.demofile, 0, track.length);
  for (i = 0; i < track.length; ++i) dest[i] = track.charCodeAt(i);
  CL.cls.demoofs = track.length;
  CL.cls.demorecording = true;
};

/**
 * Start playing a recorded demo.
 */
CL.PlayDemo_f = function () {
  if (Cmd.client === true) return;
  if (Cmd.argv.length !== 2) {
    Con.Print("playdemo <demoname> : plays a demo\n");
    return;
  }
  CL.Disconnect();
  let name = COM.DefaultExtension(Cmd.argv[1], ".dem");
  Con.Print("Playing demo from " + name + ".\n");
  let demofile = COM.LoadFile(name);
  if (demofile == null) {
    Con.Print("ERROR: couldn't open.\n");
    CL.cls.demonum = -1;
    SCR.disabled_for_loading = false;
    return;
  }
  CL.cls.demofile = demofile;
  demofile = new Uint8Array(demofile);
  CL.cls.demosize = demofile.length;
  CL.cls.demoplayback = true;
  CL.cls.state = CL.active.connected;
  CL.cls.forcetrack = 0;
  let i, c, neg;
  for (i = 0; i < demofile.length; ++i) {
    c = demofile[i];
    if (c === 10) break;
    if (c === 45) neg = true;
    else CL.cls.forcetrack = CL.cls.forcetrack * 10 + c - 48;
  }
  if (neg === true) CL.cls.forcetrack = -CL.cls.forcetrack;
  CL.cls.demoofs = i + 1;
};

/**
 * Print timing information after a timed demo completes.
 */
CL.FinishTimeDemo = function () {
  CL.cls.timedemo = false;
  let frames = Host.framecount - CL.cls.td_startframe - 1;
  let time = Host.realtime - CL.cls.td_starttime;
  if (time === 0.0) time = 1.0;
  Con.Print(
    frames +
      " frames " +
      time.toFixed(1) +
      " seconds " +
      (frames / time).toFixed(1) +
      " fps\n"
  );
};

/**
 * Play a demo with timing information.
 */
CL.TimeDemo_f = function () {
  if (Cmd.client === true) return;
  if (Cmd.argv.length !== 2) {
    Con.Print("timedemo <demoname> : gets demo speeds\n");
    return;
  }
  CL.PlayDemo_f();
  CL.cls.timedemo = true;
  CL.cls.td_startframe = Host.framecount;
  CL.cls.td_lastframe = -1;
};
