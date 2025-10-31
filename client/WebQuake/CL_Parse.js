/* globals: CDAudio COM Cmd Con CL ClientDef Host MSG Mod Protocol Q R S SCR SV Sys */

/**
 * CL_Parse - Server message parsing.
 * Handles parsing and processing messages received from the server.
 */

/**
 * Parse a sound packet from server and play it.
 */
CL.ParseStartSoundPacket = function () {
  let field_mask = MSG.ReadByte();
  let volume = (field_mask & 1) !== 0 ? MSG.ReadByte() : 255;
  let attenuation = (field_mask & 2) !== 0 ? MSG.ReadByte() * 0.015625 : 1.0;
  let channel = MSG.ReadShort();
  let sound_num = MSG.ReadByte();
  let ent = channel >> 3;
  channel &= 7;
  let pos = [MSG.ReadCoord(), MSG.ReadCoord(), MSG.ReadCoord()];
  S.StartSound(
    ent,
    channel,
    CL.state.sound_precache[sound_num],
    pos,
    volume / 255.0,
    attenuation
  );
};

/**
 * Parse server information packet.
 */
CL.ParseServerInfo = function () {
  Con.DPrint("Serverinfo packet received.\n");
  CL.ClearState();
  let i = MSG.ReadLong();
  if (i !== Protocol.version) {
    Con.Print(
      "Server returned version " + i + ", not " + Protocol.version + "\n"
    );
    return;
  }
  CL.state.maxclients = MSG.ReadByte();
  if (CL.state.maxclients <= 0 || CL.state.maxclients > 16) {
    Con.Print("Bad maxclients (" + CL.state.maxclients + ") from server\n");
    return;
  }
  CL.state.scores = [];
  for (i = 0; i < CL.state.maxclients; ++i) {
    CL.state.scores[i] = {
      // player name
      name: "",
      // time player entered the game
      entertime: 0.0,
      // player's current score
      frags: 0,
      // player color settings
      colors: 0,
    };
  }
  CL.state.gametype = MSG.ReadByte();
  CL.state.levelname = MSG.ReadString();
  Con.Print(
    "\n\n\35\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\36\37\n\n"
  );
  Con.Print("\2" + CL.state.levelname + "\n");

  let str;
  let nummodels,
    model_precache = [];
  for (nummodels = 1; ; ++nummodels) {
    str = MSG.ReadString();
    if (str.length === 0) break;
    model_precache[nummodels] = str;
  }
  let numsounds,
    sound_precache = [];
  for (numsounds = 1; ; ++numsounds) {
    str = MSG.ReadString();
    if (str.length === 0) break;
    sound_precache[numsounds] = str;
  }

  CL.state.model_precache = [];
  for (i = 1; i < nummodels; ++i) {
    CL.state.model_precache[i] = Mod.ForName(model_precache[i]);
    if (CL.state.model_precache[i] == null) {
      Con.Print("Model " + model_precache[i] + " not found\n");
      return;
    }
    CL.KeepaliveMessage();
  }
  CL.state.sound_precache = [];
  for (i = 1; i < numsounds; ++i) {
    CL.state.sound_precache[i] = S.PrecacheSound(sound_precache[i]);
    CL.KeepaliveMessage();
  }

  CL.state.worldmodel = CL.state.model_precache[1];
  CL.EntityNum(0).model = CL.state.worldmodel;
  R.NewMap();
  Host.noclip_anglehack = false;
};

/**
 * Parse entity update from server.
 * @param {number} bits - Bitfield indicating which fields are present.
 */
CL.ParseUpdate = function (bits) {
  if (CL.cls.signon === 3) {
    CL.cls.signon = 4;
    CL.SignonReply();
  }

  if ((bits & Protocol.u.morebits) !== 0) bits += MSG.ReadByte() << 8;

  let ent = CL.EntityNum(
    (bits & Protocol.u.longentity) !== 0 ? MSG.ReadShort() : MSG.ReadByte()
  );

  let forcelink = ent.msgtime !== CL.state.mtime[1];
  ent.msgtime = CL.state.mtime[0];

  let model =
    CL.state.model_precache[
      (bits & Protocol.u.model) !== 0 ? MSG.ReadByte() : ent.baseline.modelindex
    ];
  if (model !== ent.model) {
    ent.model = model;
    if (model != null)
      ent.syncbase = model.random === true ? Math.random() : 0.0;
    else forcelink = true;
  }

  ent.frame =
    (bits & Protocol.u.frame) !== 0 ? MSG.ReadByte() : ent.baseline.frame;
  ent.colormap =
    (bits & Protocol.u.colormap) !== 0 ? MSG.ReadByte() : ent.baseline.colormap;
  if (ent.colormap > CL.state.maxclients) Sys.Error("i >= cl.maxclients");
  ent.skinnum =
    (bits & Protocol.u.skin) !== 0 ? MSG.ReadByte() : ent.baseline.skin;
  ent.effects =
    (bits & Protocol.u.effects) !== 0 ? MSG.ReadByte() : ent.baseline.effects;

  ClientVec.Copy(ent.msg_origins[0], ent.msg_origins[1]);
  ClientVec.Copy(ent.msg_angles[0], ent.msg_angles[1]);
  ent.msg_origins[0][0] =
    (bits & Protocol.u.origin1) !== 0
      ? MSG.ReadCoord()
      : ent.baseline.origin[0];
  ent.msg_angles[0][0] =
    (bits & Protocol.u.angle1) !== 0 ? MSG.ReadAngle() : ent.baseline.angles[0];
  ent.msg_origins[0][1] =
    (bits & Protocol.u.origin2) !== 0
      ? MSG.ReadCoord()
      : ent.baseline.origin[1];
  ent.msg_angles[0][1] =
    (bits & Protocol.u.angle2) !== 0 ? MSG.ReadAngle() : ent.baseline.angles[1];
  ent.msg_origins[0][2] =
    (bits & Protocol.u.origin3) !== 0
      ? MSG.ReadCoord()
      : ent.baseline.origin[2];
  ent.msg_angles[0][2] =
    (bits & Protocol.u.angle3) !== 0 ? MSG.ReadAngle() : ent.baseline.angles[2];

  if ((bits & Protocol.u.nolerp) !== 0) ent.forcelink = true;

  if (forcelink === true) {
    ClientVec.Copy(ent.msg_origins[0], ent.origin);
    ClientVec.Copy(ent.origin, ent.msg_origins[1]);
    ClientVec.Copy(ent.msg_angles[0], ent.angles);
    ClientVec.Copy(ent.angles, ent.msg_angles[1]);
    ent.forcelink = true;
  }
};

/**
 * Parse entity baseline from server.
 * @param {object} ent - Entity to receive baseline data.
 */
CL.ParseBaseline = function (ent) {
  ent.baseline.modelindex = MSG.ReadByte();
  ent.baseline.frame = MSG.ReadByte();
  ent.baseline.colormap = MSG.ReadByte();
  ent.baseline.skin = MSG.ReadByte();
  ent.baseline.origin[0] = MSG.ReadCoord();
  ent.baseline.angles[0] = MSG.ReadAngle();
  ent.baseline.origin[1] = MSG.ReadCoord();
  ent.baseline.angles[1] = MSG.ReadAngle();
  ent.baseline.origin[2] = MSG.ReadCoord();
  ent.baseline.angles[2] = MSG.ReadAngle();
};

/**
 * Parse client data from server.
 * @param {number} bits - Bitfield indicating which fields are present.
 */
CL.ParseClientdata = function (bits) {
  let i;

  CL.state.viewheight =
    (bits & Protocol.su.viewheight) !== 0
      ? MSG.ReadChar()
      : Protocol.default_viewheight;
  CL.state.idealpitch =
    (bits & Protocol.su.idealpitch) !== 0 ? MSG.ReadChar() : 0.0;

  CL.state.mvelocity[1] = [
    CL.state.mvelocity[0][0],
    CL.state.mvelocity[0][1],
    CL.state.mvelocity[0][2],
  ];
  for (i = 0; i <= 2; ++i) {
    if ((bits & (Protocol.su.punch1 << i)) !== 0)
      CL.state.punchangle[i] = MSG.ReadChar();
    else CL.state.punchangle[i] = 0.0;
    if ((bits & (Protocol.su.velocity1 << i)) !== 0)
      CL.state.mvelocity[0][i] = MSG.ReadChar() * 16.0;
    else CL.state.mvelocity[0][i] = 0.0;
  }

  i = MSG.ReadLong();
  let j;
  if (CL.state.items !== i) {
    for (j = 0; j <= 31; ++j) {
      if (((i >>> j) & 1) !== 0 && ((CL.state.items >>> j) & 1) === 0)
        CL.state.item_gettime[j] = CL.state.time;
    }
    CL.state.items = i;
  }

  CL.state.onground = (bits & Protocol.su.onground) !== 0;
  CL.state.inwater = (bits & Protocol.su.inwater) !== 0;

  CL.state.stats[ClientDef.stat.weaponframe] =
    (bits & Protocol.su.weaponframe) !== 0 ? MSG.ReadByte() : 0;
  CL.state.stats[ClientDef.stat.armor] =
    (bits & Protocol.su.armor) !== 0 ? MSG.ReadByte() : 0;
  CL.state.stats[ClientDef.stat.weapon] =
    (bits & Protocol.su.weapon) !== 0 ? MSG.ReadByte() : 0;
  CL.state.stats[ClientDef.stat.health] = MSG.ReadShort();
  CL.state.stats[ClientDef.stat.ammo] = MSG.ReadByte();
  CL.state.stats[ClientDef.stat.shells] = MSG.ReadByte();
  CL.state.stats[ClientDef.stat.nails] = MSG.ReadByte();
  CL.state.stats[ClientDef.stat.rockets] = MSG.ReadByte();
  CL.state.stats[ClientDef.stat.cells] = MSG.ReadByte();
  if (COM.standard_quake === true)
    CL.state.stats[ClientDef.stat.activeweapon] = MSG.ReadByte();
  else CL.state.stats[ClientDef.stat.activeweapon] = 1 << MSG.ReadByte();
};

/**
 * Parse static entity from server.
 */
CL.ParseStatic = function () {
  let ent = {
    // entity number (-1 for static entities)
    num: -1,
    // update type
    update_type: 0,
    // baseline state
    baseline: { origin: [], angles: [] },
    // timestamp of last message
    msgtime: 0.0,
    // interpolated origin positions
    msg_origins: [
      [0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0],
    ],
    // interpolated angles
    msg_angles: [
      [0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0],
    ],
    // animation synchronization base
    syncbase: 0.0,
    // current vis frame
    visframe: 0,
    // dynamic light frame
    dlightframe: 0,
    // dynamic light bits
    dlightbits: 0,
    // leaf nodes this entity is in
    leafs: [],
  };
  CL.static_entities[CL.state.num_statics++] = ent;
  CL.ParseBaseline(ent);
  ent.model = CL.state.model_precache[ent.baseline.modelindex];
  ent.frame = ent.baseline.frame;
  ent.skinnum = ent.baseline.skin;
  ent.effects = ent.baseline.effects;
  ent.origin = [
    ent.baseline.origin[0],
    ent.baseline.origin[1],
    ent.baseline.origin[2],
  ];
  ent.angles = [
    ent.baseline.angles[0],
    ent.baseline.angles[1],
    ent.baseline.angles[2],
  ];
  R.currententity = ent;
  R.emins = [
    ent.origin[0] + ent.model.mins[0],
    ent.origin[1] + ent.model.mins[1],
    ent.origin[2] + ent.model.mins[2],
  ];
  R.emaxs = [
    ent.origin[0] + ent.model.maxs[0],
    ent.origin[1] + ent.model.maxs[1],
    ent.origin[2] + ent.model.maxs[2],
  ];
  R.SplitEntityOnNode(CL.state.worldmodel.nodes[0]);
};

/**
 * Parse static sound from server.
 */
CL.ParseStaticSound = function () {
  let org = [MSG.ReadCoord(), MSG.ReadCoord(), MSG.ReadCoord()];
  let sound_num = MSG.ReadByte();
  let vol = MSG.ReadByte();
  let atten = MSG.ReadByte();
  S.StaticSound(CL.state.sound_precache[sound_num], org, vol / 255.0, atten);
};

/**
 * Print network message debug info.
 * @param {number} x - Verbosity level.
 */
CL.Shownet = function (x) {
  if (CL.shownet.value === 2) {
    Con.Print(
      (MSG.readcount <= 99 ? (MSG.readcount <= 9 ? "  " : " ") : "") +
        (MSG.readcount - 1) +
        ":" +
        x +
        "\n"
    );
  }
};

/**
 * Parse messages received from server.
 */
CL.ParseServerMessage = function () {
  if (CL.shownet.value === 1) Con.Print(NET.message.cursize + " ");
  else if (CL.shownet.value === 2) Con.Print("------------------\n");

  CL.state.onground = false;

  MSG.BeginReading();

  let cmd, i;
  for (;;) {
    if (MSG.badread === true)
      Host.Error("CL.ParseServerMessage: Bad server message");

    cmd = MSG.ReadByte();

    if (cmd === -1) {
      CL.Shownet("END OF MESSAGE");
      return;
    }

    if ((cmd & 128) !== 0) {
      CL.Shownet("fast update");
      CL.ParseUpdate(cmd & 127);
      continue;
    }

    CL.Shownet("svc_" + CL.svc_strings[cmd]);
    switch (cmd) {
      case Protocol.svc.nop:
        continue;
      case Protocol.svc.time:
        CL.state.mtime[1] = CL.state.mtime[0];
        CL.state.mtime[0] = MSG.ReadFloat();
        continue;
      case Protocol.svc.clientdata:
        CL.ParseClientdata(MSG.ReadShort());
        continue;
      case Protocol.svc.version:
        i = MSG.ReadLong();
        if (i !== Protocol.version)
          Host.Error(
            "CL.ParseServerMessage: Server is protocol " +
              i +
              " instead of " +
              Protocol.version +
              "\n"
          );
        continue;
      case Protocol.svc.disconnect:
        Host.EndGame("Server disconnected\n");
      case Protocol.svc.print:
        Con.Print(MSG.ReadString());
        continue;
      case Protocol.svc.centerprint:
        SCR.CenterPrint(MSG.ReadString());
        continue;
      case Protocol.svc.stufftext:
        Cmd.text += MSG.ReadString();
        continue;
      case Protocol.svc.damage:
        V.ParseDamage();
        continue;
      case Protocol.svc.serverinfo:
        CL.ParseServerInfo();
        SCR.recalc_refdef = true;
        continue;
      case Protocol.svc.setangle:
        CL.state.viewangles[0] = MSG.ReadAngle();
        CL.state.viewangles[1] = MSG.ReadAngle();
        CL.state.viewangles[2] = MSG.ReadAngle();
        continue;
      case Protocol.svc.setview:
        CL.state.viewentity = MSG.ReadShort();
        continue;
      case Protocol.svc.lightstyle:
        i = MSG.ReadByte();
        if (i >= 64) Sys.Error("svc_lightstyle > MAX_LIGHTSTYLES");
        CL.lightstyle[i] = MSG.ReadString();
        continue;
      case Protocol.svc.sound:
        CL.ParseStartSoundPacket();
        continue;
      case Protocol.svc.stopsound:
        i = MSG.ReadShort();
        S.StopSound(i >> 3, i & 7);
        continue;
      case Protocol.svc.updatename:
        i = MSG.ReadByte();
        if (i >= CL.state.maxclients)
          Host.Error("CL.ParseServerMessage: svc_updatename > MAX_SCOREBOARD");
        CL.state.scores[i].name = MSG.ReadString();
        continue;
      case Protocol.svc.updatefrags:
        i = MSG.ReadByte();
        if (i >= CL.state.maxclients)
          Host.Error("CL.ParseServerMessage: svc_updatefrags > MAX_SCOREBOARD");
        CL.state.scores[i].frags = MSG.ReadShort();
        continue;
      case Protocol.svc.updatecolors:
        i = MSG.ReadByte();
        if (i >= CL.state.maxclients)
          Host.Error(
            "CL.ParseServerMessage: svc_updatecolors > MAX_SCOREBOARD"
          );
        CL.state.scores[i].colors = MSG.ReadByte();
        continue;
      case Protocol.svc.particle:
        R.ParseParticleEffect();
        continue;
      case Protocol.svc.spawnbaseline:
        CL.ParseBaseline(CL.EntityNum(MSG.ReadShort()));
        continue;
      case Protocol.svc.spawnstatic:
        CL.ParseStatic();
        continue;
      case Protocol.svc.temp_entity:
        CL.ParseTEnt();
        continue;
      case Protocol.svc.setpause:
        CL.state.paused = MSG.ReadByte() !== 0;
        if (CL.state.paused === true) CDAudio.Pause();
        else CDAudio.Resume();
        continue;
      case Protocol.svc.signonnum:
        i = MSG.ReadByte();
        if (i <= CL.cls.signon)
          Host.Error("Received signon " + i + " when at " + CL.cls.signon);
        CL.cls.signon = i;
        CL.SignonReply();
        continue;
      case Protocol.svc.killedmonster:
        ++CL.state.stats[ClientDef.stat.monsters];
        continue;
      case Protocol.svc.foundsecret:
        ++CL.state.stats[ClientDef.stat.secrets];
        continue;
      case Protocol.svc.updatestat:
        i = MSG.ReadByte();
        if (i >= 32) Sys.Error("svc_updatestat: " + i + " is invalid");
        CL.state.stats[i] = MSG.ReadLong();
        continue;
      case Protocol.svc.spawnstaticsound:
        CL.ParseStaticSound();
        continue;
      case Protocol.svc.cdtrack:
        CL.state.cdtrack = MSG.ReadByte();
        MSG.ReadByte();
        if (
          (CL.cls.demoplayback === true || CL.cls.demorecording === true) &&
          CL.cls.forcetrack !== -1
        )
          CDAudio.Play(CL.cls.forcetrack, true);
        else CDAudio.Play(CL.state.cdtrack, true);
        continue;
      case Protocol.svc.intermission:
        CL.state.intermission = 1;
        CL.state.completed_time = CL.state.time;
        SCR.recalc_refdef = true;
        continue;
      case Protocol.svc.finale:
        CL.state.intermission = 2;
        CL.state.completed_time = CL.state.time;
        SCR.recalc_refdef = true;
        SCR.CenterPrint(MSG.ReadString());
        continue;
      case Protocol.svc.cutscene:
        CL.state.intermission = 3;
        CL.state.completed_time = CL.state.time;
        SCR.recalc_refdef = true;
        SCR.CenterPrint(MSG.ReadString());
        continue;
      case Protocol.svc.sellscreen:
        Cmd.ExecuteString("help");
        continue;
    }
    Host.Error("CL.ParseServerMessage: Illegible server message\n");
  }
};
