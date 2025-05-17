// Host command handlers
HostCommands = {
  Status_f: function () {
    let printFunc;
    if (Cmd.client !== true) {
      if (SV.server.active !== true) return;
      printFunc = Con.Print;
    } else printFunc = Host.ClientPrint;
    printFunc("host:    " + NET.hostname.string + "\n");
    printFunc("version: 1.09\n");
    printFunc(
      "map:     " + PR.GetString(PR.globals_int[PR.globalvars.mapname]) + "\n"
    );
    printFunc(
      "players: " +
        NET.activeconnections +
        " active (" +
        SV.svs.maxclients +
        " max)\n\n"
    );
    let clientIndex,
      client,
      formattedOutput,
      formattedFrags,
      hours,
      minutes,
      seconds;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      client = SV.svs.clients[clientIndex];
      if (client.active !== true) continue;
      formattedFrags = client.edict.v_float[PR.entvars.frags].toFixed(0);
      if (formattedFrags.length === 1) formattedFrags = "  " + formattedFrags;
      else if (formattedFrags.length === 2)
        formattedFrags = " " + formattedFrags;
      seconds = (NET.time - client.netconnection.connecttime) >> 0;
      hours = 0;
      minutes = (seconds / 60) >> 0;
      if (minutes !== 0) {
        seconds -= minutes * 60;
        hours = (minutes / 60) >> 0;
        if (hours !== 0) minutes -= hours * 60;
      }
      formattedOutput = `#${clientIndex + 1}${clientIndex <= 8 ? " " : ""}`;
      formattedOutput += SV.GetClientName(client);
      for (; formattedOutput.length <= 21; ) formattedOutput += " ";
      formattedOutput += `${formattedFrags}  ${hours <= 9 ? " " : ""}${hours}:${
        minutes <= 9 ? "0" : ""
      }${minutes}:${seconds <= 9 ? "0" : ""}${seconds}\n`;
      printFunc(formattedOutput);
      printFunc(`   ${client.netconnection.address}\n`);
    }
  },

  Quit_f: function () {
    Sys.Quit();
  },

  God_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    SV.player.v_float[PR.entvars.flags] ^= SV.fl.godmode;
    if ((SV.player.v_float[PR.entvars.flags] & SV.fl.godmode) === 0)
      Host.ClientPrint("godmode OFF\n");
    else Host.ClientPrint("godmode ON\n");
  },

  Notarget_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    SV.player.v_float[PR.entvars.flags] ^= SV.fl.notarget;
    if ((SV.player.v_float[PR.entvars.flags] & SV.fl.notarget) === 0)
      Host.ClientPrint("notarget OFF\n");
    else Host.ClientPrint("notarget ON\n");
  },

  Noclip_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    if (SV.player.v_float[PR.entvars.movetype] !== SV.movetype.noclip) {
      Host.noclip_anglehack = true;
      SV.player.v_float[PR.entvars.movetype] = SV.movetype.noclip;
      Host.ClientPrint("noclip ON\n");
      return;
    }
    Host.noclip_anglehack = false;
    SV.player.v_float[PR.entvars.movetype] = SV.movetype.walk;
    Host.ClientPrint("noclip OFF\n");
  },

  Fly_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    if (SV.player.v_float[PR.entvars.movetype] !== SV.movetype.fly) {
      SV.player.v_float[PR.entvars.movetype] = SV.movetype.fly;
      Host.ClientPrint("flymode ON\n");
      return;
    }
    SV.player.v_float[PR.entvars.movetype] = SV.movetype.walk;
    Host.ClientPrint("flymode OFF\n");
  },

  Ping_f: function () {
    if (Cmd.client !== true) return;
    Host.ClientPrint("Client ping times:\n");
    let clientIndex, client, totalPing, pingIndex;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      client = SV.svs.clients[clientIndex];
      if (client.active !== true) continue;
      totalPing = 0;
      for (pingIndex = 0; pingIndex <= 15; ++pingIndex)
        totalPing += client.ping_times[pingIndex];
      totalPing = (totalPing * 62.5).toFixed(0);
      if (totalPing.length === 1) totalPing = "   " + totalPing;
      else if (totalPing.length === 2) totalPing = "  " + totalPing;
      else if (totalPing.length === 3) totalPing = " " + totalPing;
      Host.ClientPrint(totalPing + " " + SV.GetClientName(client) + "\n");
    }
  },

  Map_f: function () {
    if (Cmd.argv.length <= 1) {
      Con.Print("USAGE: map <map>\n");
      return;
    }
    if (Cmd.client === true) return;
    Host.ShutdownServer();
    SV.svs.serverflags = 0;
    SV.SpawnServer(Cmd.argv[1]);
  },

  Changelevel_f: function () {
    if (Cmd.argv.length !== 2) {
      Con.Print("changelevel <levelname> : continue game on a new level\n");
      return;
    }
    if (SV.server.active !== true) {
      Con.Print("Only the server may changelevel\n");
      return;
    }
    SV.SaveSpawnparms();
    SV.SpawnServer(Cmd.argv[1]);
  },

  Restart_f: function () {
    if (SV.server.active === true && Cmd.client !== true)
      SV.SpawnServer(PR.GetString(PR.globals_int[PR.globalvars.mapname]));
  },

  Name_f: function () {
    if (Cmd.argv.length <= 1 || Cmd.client !== true) return;

    let newName;
    if (Cmd.argv.length === 2) newName = Cmd.argv[1].substring(0, 15);
    else newName = Cmd.args.substring(0, 15);

    const oldName = SV.GetClientName(Host.client);
    SV.SetClientName(Host.client, newName);
    const datagram = SV.server.reliable_datagram;
    MSG.WriteByte(datagram, Protocol.svc.updatename);
    MSG.WriteByte(datagram, Host.client.num);
    MSG.WriteString(datagram, newName);
  },

  Version_f: function () {
    Con.Print("Version 1.09\n");
    Con.Print(Def.timedate);
  },

  Say: function (teamonly) {
    if (SV.server.active !== true) return;
    if (Cmd.argv.length <= 1) return;
    const savedClient = Host.client;
    let messageText = Cmd.args;
    if (messageText.charCodeAt(0) === 34)
      messageText = messageText.substring(1, messageText.length - 1);

    let formattedMessage;
    if (Cmd.client === true)
      formattedMessage = "\x01" + SV.GetClientName(savedClient) + ": ";
    else {
      formattedMessage = "\x01<" + NET.hostname.string + "> ";
      teamonly = false;
    }

    const maxLength = 62 - formattedMessage.length;
    if (messageText.length > maxLength)
      messageText = messageText.substring(0, maxLength);
    formattedMessage += messageText + "\n";

    let clientIndex, client;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      client = SV.svs.clients[clientIndex];
      if (client.active !== true || client.spawned !== true) continue;
      if (
        Host.teamplay.value !== 0 &&
        teamonly === true &&
        client.v_float[PR.entvars.team] !== savedClient.v_float[PR.entvars.team]
      )
        continue;
      Host.client = client;
      Host.ClientPrint(formattedMessage);
    }
    Host.client = savedClient;
    Sys.Print(formattedMessage.substring(1));
  },

  Say_Team_f: function () {
    Host.Say(true);
  },

  Tell_f: function () {
    if (Cmd.client !== true) return;
    if (Cmd.argv.length <= 2) return;
    let messageText = SV.GetClientName(Host.client) + ": ";
    let messageContent = Cmd.args;
    if (messageContent.charCodeAt(0) === 34)
      messageContent = messageContent.substring(1, messageContent.length - 1);
    const maxLength = 62 - messageText.length;
    if (messageContent.length > maxLength)
      messageContent = messageContent.substring(0, maxLength);
    messageText += messageContent + "\n";

    const savedClient = Host.client;
    let clientIndex, client;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      client = SV.svs.clients[clientIndex];
      if (client.active !== true || client.spawned !== true) continue;
      if (SV.GetClientName(client).toLowerCase() !== Cmd.argv[1].toLowerCase())
        continue;
      Host.client = client;
      Host.ClientPrint(messageText);
      break;
    }
    Host.client = savedClient;
  },

  Color_f: function () {
    if (Cmd.argv.length <= 1 || Cmd.client !== true) return;

    let topColor, bottomColor;
    if (Cmd.argv.length === 2)
      topColor = bottomColor = (Q.atoi(Cmd.argv[1]) & 15) >>> 0;
    else {
      topColor = (Q.atoi(Cmd.argv[1]) & 15) >>> 0;
      bottomColor = (Q.atoi(Cmd.argv[2]) & 15) >>> 0;
    }
    if (topColor >= 14) topColor = 13;
    if (bottomColor >= 14) bottomColor = 13;
    const playerColor = (topColor << 4) + bottomColor;

    Host.client.colors = playerColor;
    Host.client.edict.v_float[PR.entvars.team] = bottomColor + 1;
    const datagram = SV.server.reliable_datagram;
    MSG.WriteByte(datagram, Protocol.svc.updatecolors);
    MSG.WriteByte(datagram, Host.client.num);
    MSG.WriteByte(datagram, playerColor);
  },

  Kill_f: function () {
    if (Cmd.client !== true) return;
    if (SV.player.v_float[PR.entvars.health] <= 0.0) {
      Host.ClientPrint("Can't suicide -- allready dead!\n");
      return;
    }
    PR.globals_float[PR.globalvars.time] = SV.server.time;
    PR.globals_int[PR.globalvars.self] = SV.player.num;
    PR.ExecuteProgram(PR.globals_int[PR.globalvars.ClientKill]);
  },

  Pause_f: function () {
    if (Cmd.client !== true) return;
    if (Host.pausable.value === 0) {
      Host.ClientPrint("Pause not allowed.\n");
      return;
    }
    SV.server.paused = !SV.server.paused;
    Host.BroadcastPrint(
      SV.GetClientName(Host.client) +
        (SV.server.paused === true
          ? " paused the game\n"
          : " unpaused the game\n")
    );
    MSG.WriteByte(SV.server.reliable_datagram, Protocol.svc.setpause);
    MSG.WriteByte(
      SV.server.reliable_datagram,
      SV.server.paused === true ? 1 : 0
    );
  },

  PreSpawn_f: function () {
    if (Cmd.client !== true) {
      Con.Print("prespawn is not valid from the console\n");
      return;
    }
    const currentClient = Host.client;
    if (currentClient.spawned === true) {
      Con.Print("prespawn not valid -- allready spawned\n");
      return;
    }
    SZ.Write(
      currentClient.message,
      new Uint8Array(SV.server.signon.data),
      SV.server.signon.cursize
    );
    MSG.WriteByte(currentClient.message, Protocol.svc.signonnum);
    MSG.WriteByte(currentClient.message, 2);
    currentClient.sendsignon = true;
  },

  Spawn_f: function () {
    if (Cmd.client !== true) {
      Con.Print("spawn is not valid from the console\n");
      return;
    }
    const currentClient = Host.client;
    if (currentClient.spawned === true) {
      Con.Print("Spawn not valid -- allready spawned\n");
      return;
    }

    let entityIndex;
    let clientEntity = currentClient.edict;

    for (entityIndex = 0; entityIndex < PR.entityfields; ++entityIndex)
      clientEntity.v_int[entityIndex] = 0;

    clientEntity.v_float[PR.entvars.colormap] = clientEntity.num;
    clientEntity.v_float[PR.entvars.team] = (currentClient.colors & 15) + 1;
    clientEntity.v_int[PR.entvars.netname] =
      PR.netnames + (currentClient.num << 5);

    for (entityIndex = 0; entityIndex <= 15; ++entityIndex)
      PR.globals_float[PR.globalvars.parms + entityIndex] =
        currentClient.spawn_parms[entityIndex];

    PR.globals_float[PR.globalvars.time] = SV.server.time;
    PR.globals_int[PR.globalvars.self] = clientEntity.num;
    PR.ExecuteProgram(PR.globals_int[PR.globalvars.ClientConnect]);

    if (
      Sys.FloatTime() - currentClient.netconnection.connecttime <=
      SV.server.time
    )
      Sys.Print(SV.GetClientName(currentClient) + " entered the game\n");

    PR.ExecuteProgram(PR.globals_int[PR.globalvars.PutClientInServer]);

    const clientMessage = currentClient.message;
    clientMessage.cursize = 0;
    MSG.WriteByte(clientMessage, Protocol.svc.time);
    MSG.WriteFloat(clientMessage, SV.server.time);

    let clientIndex, iteratedClient;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      iteratedClient = SV.svs.clients[clientIndex];
      MSG.WriteByte(clientMessage, Protocol.svc.updatename);
      MSG.WriteByte(clientMessage, clientIndex);
      MSG.WriteString(clientMessage, SV.GetClientName(iteratedClient));
      MSG.WriteByte(clientMessage, Protocol.svc.updatefrags);
      MSG.WriteByte(clientMessage, clientIndex);
      MSG.WriteShort(clientMessage, iteratedClient.old_frags);
      MSG.WriteByte(clientMessage, Protocol.svc.updatecolors);
      MSG.WriteByte(clientMessage, clientIndex);
      MSG.WriteByte(clientMessage, iteratedClient.colors);
    }

    for (let lightstyleIndex = 0; lightstyleIndex <= 63; ++lightstyleIndex) {
      MSG.WriteByte(clientMessage, Protocol.svc.lightstyle);
      MSG.WriteByte(clientMessage, lightstyleIndex);
      MSG.WriteString(clientMessage, SV.server.lightstyles[lightstyleIndex]);
    }

    MSG.WriteByte(clientMessage, Protocol.svc.updatestat);
    MSG.WriteByte(clientMessage, Def.stat.totalsecrets);
    MSG.WriteLong(clientMessage, PR.globals_float[PR.globalvars.total_secrets]);
    MSG.WriteByte(clientMessage, Protocol.svc.updatestat);
    MSG.WriteByte(clientMessage, Def.stat.totalmonsters);
    MSG.WriteLong(
      clientMessage,
      PR.globals_float[PR.globalvars.total_monsters]
    );
    MSG.WriteByte(clientMessage, Protocol.svc.updatestat);
    MSG.WriteByte(clientMessage, Def.stat.secrets);
    MSG.WriteLong(clientMessage, PR.globals_float[PR.globalvars.found_secrets]);
    MSG.WriteByte(clientMessage, Protocol.svc.updatestat);
    MSG.WriteByte(clientMessage, Def.stat.monsters);
    MSG.WriteLong(
      clientMessage,
      PR.globals_float[PR.globalvars.killed_monsters]
    );
    MSG.WriteByte(clientMessage, Protocol.svc.setangle);

    const playerEntity = SV.server.edicts[1 + Host.client.num];
    MSG.WriteAngle(clientMessage, playerEntity.v_float[PR.entvars.angles]);
    MSG.WriteAngle(clientMessage, playerEntity.v_float[PR.entvars.angles1]);
    MSG.WriteAngle(clientMessage, 0.0);
    SV.WriteClientdataToMessage(playerEntity, clientMessage);
    MSG.WriteByte(clientMessage, Protocol.svc.signonnum);
    MSG.WriteByte(clientMessage, 3);
    Host.client.sendsignon = true;
  },

  Begin_f: function () {
    if (Cmd.client !== true) {
      Con.Print("begin is not valid from the console\n");
      return;
    }
    Host.client.spawned = true;
  },

  Kick_f: function () {
    if (SV.server.active !== true) return;
    if (
      Cmd.client === true &&
      PR.globals_float[PR.globalvars.deathmatch] !== 0.0
    )
      return;
    const savedClient = Host.client;
    let clientIndex, isKickByNumber;
    if (Cmd.argv.length >= 3 && Cmd.argv[1] === "#") {
      clientIndex = Q.atoi(Cmd.argv[2]) - 1;
      if (clientIndex < 0 || clientIndex >= SV.svs.maxclients) return;
      if (SV.svs.clients[clientIndex].active !== true) return;
      Host.client = SV.svs.clients[clientIndex];
      isKickByNumber = true;
    } else {
      for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
        Host.client = SV.svs.clients[clientIndex];
        if (Host.client.active !== true) continue;
        if (
          SV.GetClientName(Host.client).toLowerCase() ===
          Cmd.argv[1].toLowerCase()
        )
          break;
      }
    }
    if (clientIndex >= SV.svs.maxclients) {
      Host.client = savedClient;
      return;
    }
    let kickerName;
    if (Cmd.client !== true) kickerName = "Console";
    else {
      if (Host.client === savedClient) return;
      kickerName = SV.GetClientName(savedClient);
    }
    let kickMessage;
    if (Cmd.argv.length >= 3) kickMessage = COM.Parse(Cmd.args);
    if (kickMessage != null) {
      let messageStartPos = 0;
      if (isKickByNumber === true) {
        ++messageStartPos;
        for (; messageStartPos < kickMessage.length; ++messageStartPos) {
          if (kickMessage.charCodeAt(messageStartPos) !== 32) break;
        }
        messageStartPos += Cmd.argv[2].length;
      }
      for (; messageStartPos < kickMessage.length; ++messageStartPos) {
        if (kickMessage.charCodeAt(messageStartPos) !== 32) break;
      }
      Host.ClientPrint(
        "Kicked by " +
          kickerName +
          ": " +
          kickMessage.substring(messageStartPos) +
          "\n"
      );
    } else Host.ClientPrint("Kicked by " + kickerName + "\n");
    Host.DropClient();
    Host.client = savedClient;
  },

  Give_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    if (Cmd.argv.length <= 1) return;
    const itemId = Cmd.argv[1].charCodeAt(0);
    const playerEntity = SV.player;

    if (itemId >= 48 && itemId <= 57) {
      if (COM.hipnotic !== true) {
        if (itemId >= 50)
          playerEntity.v_float[PR.entvars.items] |=
            Def.it.shotgun << (itemId - 50);
        return;
      }
      if (itemId === 54) {
        if (Cmd.argv[1].charCodeAt(1) === 97)
          playerEntity.v_float[PR.entvars.items] |= Def.hit.proximity_gun;
        else playerEntity.v_float[PR.entvars.items] |= Def.it.grenade_launcher;
        return;
      }
      if (itemId === 57)
        playerEntity.v_float[PR.entvars.items] |= Def.hit.laser_cannon;
      else if (itemId === 48)
        playerEntity.v_float[PR.entvars.items] |= Def.hit.mjolnir;
      else if (itemId >= 50)
        playerEntity.v_float[PR.entvars.items] |=
          Def.it.shotgun << (itemId - 50);
      return;
    }

    const amount = Q.atoi(Cmd.argv[2]);

    if (itemId === 104) {
      playerEntity.v_float[PR.entvars.health] = amount;
      return;
    }

    if (COM.rogue !== true) {
      switch (itemId) {
        case 115:
          playerEntity.v_float[PR.entvars.ammo_shells] = amount;
          return;
        case 110:
          playerEntity.v_float[PR.entvars.ammo_nails] = amount;
          return;
        case 114:
          playerEntity.v_float[PR.entvars.ammo_rockets] = amount;
          return;
        case 99:
          playerEntity.v_float[PR.entvars.ammo_cells] = amount;
      }
      return;
    }

    switch (itemId) {
      case 115:
        if (PR.entvars.ammo_shells1 != null)
          playerEntity.v_float[PR.entvars.ammo_shells1] = amount;
        playerEntity.v_float[PR.entvars.ammo_shells] = amount;
        return;
      case 110:
        if (PR.entvars.ammo_nails1 != null) {
          playerEntity.v_float[PR.entvars.ammo_nails1] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] <= Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_nails] = amount;
        }
        return;
      case 108:
        if (PR.entvars.ammo_lava_nails != null) {
          playerEntity.v_float[PR.entvars.ammo_lava_nails] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] > Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_nails] = amount;
        }
        return;
      case 114:
        if (PR.entvars.ammo_rockets1 != null) {
          playerEntity.v_float[PR.entvars.ammo_rockets1] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] <= Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_rockets] = amount;
        }
        return;
      case 109:
        if (PR.entvars.ammo_multi_rockets != null) {
          playerEntity.v_float[PR.entvars.ammo_multi_rockets] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] > Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_rockets] = amount;
        }
        return;
      case 99:
        if (PR.entvars.ammo_cells1 != null) {
          playerEntity.v_float[PR.entvars.ammo_cells1] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] <= Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_cells] = amount;
        }
        return;
      case 112:
        if (PR.entvars.ammo_plasma != null) {
          playerEntity.v_float[PR.entvars.ammo_plasma] = amount;
          if (playerEntity.v_float[PR.entvars.weapon] > Def.it.lightning)
            playerEntity.v_float[PR.entvars.ammo_cells] = amount;
        }
    }
  },

  Startdemos_f: function () {
    if (SV.server.active !== true) Cmd.text += "map start\n";
  },

  InitCommands: function () {
    Cmd.AddCommand("status", Host.Status_f);
    Cmd.AddCommand("quit", Host.Quit_f);
    Cmd.AddCommand("god", Host.God_f);
    Cmd.AddCommand("notarget", Host.Notarget_f);
    Cmd.AddCommand("fly", Host.Fly_f);
    Cmd.AddCommand("map", Host.Map_f);
    Cmd.AddCommand("restart", Host.Restart_f);
    Cmd.AddCommand("changelevel", Host.Changelevel_f);
    Cmd.AddCommand("name", Host.Name_f);
    Cmd.AddCommand("noclip", Host.Noclip_f);
    Cmd.AddCommand("version", Host.Version_f);
    Cmd.AddCommand("say", Host.Say);
    Cmd.AddCommand("say_team", Host.Say_Team_f);
    Cmd.AddCommand("tell", Host.Tell_f);
    Cmd.AddCommand("color", Host.Color_f);
    Cmd.AddCommand("kill", Host.Kill_f);
    Cmd.AddCommand("pause", Host.Pause_f);
    Cmd.AddCommand("spawn", Host.Spawn_f);
    Cmd.AddCommand("begin", Host.Begin_f);
    Cmd.AddCommand("prespawn", Host.PreSpawn_f);
    Cmd.AddCommand("kick", Host.Kick_f);
    Cmd.AddCommand("ping", Host.Ping_f);
    Cmd.AddCommand("give", Host.Give_f);
    Cmd.AddCommand("startdemos", Host.Startdemos_f);
    Cmd.AddCommand("mcache", Mod.Print);
  },
};
