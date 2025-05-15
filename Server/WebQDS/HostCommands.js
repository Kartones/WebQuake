// Host command handlers
HostCommands = {
  Status_f: function () {
    var print;
    if (Cmd.client !== true) {
      if (SV.server.active !== true) return;
      print = Con.Print;
    } else print = Host.ClientPrint;
    print("host:    " + NET.hostname.string + "\n");
    print("version: 1.09\n");
    print(
      "map:     " + PR.GetString(PR.globals_int[PR.globalvars.mapname]) + "\n"
    );
    print(
      "players: " +
        NET.activeconnections +
        " active (" +
        SV.svs.maxclients +
        " max)\n\n"
    );
    var i, client, str, frags, hours, minutes, seconds;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true) continue;
      frags = client.edict.v_float[PR.entvars.frags].toFixed(0);
      if (frags.length === 1) frags = "  " + frags;
      else if (frags.length === 2) frags = " " + frags;
      seconds = (NET.time - client.netconnection.connecttime) >> 0;
      minutes = (seconds / 60) >> 0;
      if (minutes !== 0) {
        seconds -= minutes * 60;
        hours = (minutes / 60) >> 0;
        if (hours !== 0) minutes -= hours * 60;
      } else hours = 0;
      str = "#" + (i + 1) + " ";
      if (i <= 8) str += " ";
      str += SV.GetClientName(client);
      for (; str.length <= 21; ) str += " ";
      str += frags + "  ";
      if (hours <= 9) str += " ";
      str += hours + ":";
      if (minutes <= 9) str += "0";
      str += minutes + ":";
      if (seconds <= 9) str += "0";
      print(str + seconds + "\n");
      print("   " + client.netconnection.address + "\n");
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
    var i, client, total, j;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true) continue;
      total = 0;
      for (j = 0; j <= 15; ++j) total += client.ping_times[j];
      total = (total * 62.5).toFixed(0);
      if (total.length === 1) total = "   " + total;
      else if (total.length === 2) total = "  " + total;
      else if (total.length === 3) total = " " + total;
      Host.ClientPrint(total + " " + SV.GetClientName(client) + "\n");
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

    var newName;
    if (Cmd.argv.length === 2) newName = Cmd.argv[1].substring(0, 15);
    else newName = Cmd.args.substring(0, 15);

    var name = SV.GetClientName(Host.client);
    SV.SetClientName(Host.client, newName);
    var msg = SV.server.reliable_datagram;
    MSG.WriteByte(msg, Protocol.svc.updatename);
    MSG.WriteByte(msg, Host.client.num);
    MSG.WriteString(msg, newName);
  },

  Version_f: function () {
    Con.Print("Version 1.09\n");
    Con.Print(Def.timedate);
  },

  Say: function (teamonly) {
    if (SV.server.active !== true) return;
    if (Cmd.argv.length <= 1) return;
    var save = Host.client;
    var p = Cmd.args;
    if (p.charCodeAt(0) === 34) p = p.substring(1, p.length - 1);
    if (Cmd.client === true) text = "\x01" + SV.GetClientName(save) + ": ";
    else {
      text = "\x01<" + NET.hostname.string + "> ";
      teamonly = false;
    }
    var i = 62 - text.length;
    if (p.length > i) p = p.substring(0, i);
    text += p + "\n";
    var client;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true || client.spawned !== true) continue;
      if (
        Host.teamplay.value !== 0 &&
        teamonly === true &&
        client.v_float[PR.entvars.team] !== save.v_float[PR.entvars.team]
      )
        continue;
      Host.client = client;
      Host.ClientPrint(text);
    }
    Host.client = save;
    Sys.Print(text.substring(1));
  },

  Say_Team_f: function () {
    Host.Say(true);
  },

  Tell_f: function () {
    if (Cmd.client !== true) return;
    if (Cmd.argv.length <= 2) return;
    var text = SV.GetClientName(Host.client) + ": ";
    var p = Cmd.args;
    if (p.charCodeAt(0) === 34) p = p.substring(1, p.length - 1);
    var i = 62 - text.length;
    if (p.length > i) p = p.substring(0, i);
    text += p + "\n";
    var save = Host.client,
      client;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true || client.spawned !== true) continue;
      if (SV.GetClientName(client).toLowerCase() !== Cmd.argv[1].toLowerCase())
        continue;
      Host.client = client;
      Host.ClientPrint(text);
      break;
    }
    Host.client = save;
  },

  Color_f: function () {
    if (Cmd.argv.length <= 1 || Cmd.client !== true) return;

    var top, bottom;
    if (Cmd.argv.length === 2) top = bottom = (Q.atoi(Cmd.argv[1]) & 15) >>> 0;
    else {
      top = (Q.atoi(Cmd.argv[1]) & 15) >>> 0;
      bottom = (Q.atoi(Cmd.argv[2]) & 15) >>> 0;
    }
    if (top >= 14) top = 13;
    if (bottom >= 14) bottom = 13;
    var playercolor = (top << 4) + bottom;

    Host.client.colors = playercolor;
    Host.client.edict.v_float[PR.entvars.team] = bottom + 1;
    var msg = SV.server.reliable_datagram;
    MSG.WriteByte(msg, Protocol.svc.updatecolors);
    MSG.WriteByte(msg, Host.client.num);
    MSG.WriteByte(msg, playercolor);
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
    var client = Host.client;
    if (client.spawned === true) {
      Con.Print("prespawn not valid -- allready spawned\n");
      return;
    }
    SZ.Write(
      client.message,
      new Uint8Array(SV.server.signon.data),
      SV.server.signon.cursize
    );
    MSG.WriteByte(client.message, Protocol.svc.signonnum);
    MSG.WriteByte(client.message, 2);
    client.sendsignon = true;
  },

  Spawn_f: function () {
    if (Cmd.client !== true) {
      Con.Print("spawn is not valid from the console\n");
      return;
    }
    var client = Host.client;
    if (client.spawned === true) {
      Con.Print("Spawn not valid -- allready spawned\n");
      return;
    }

    var i;

    var ent = client.edict;
    for (i = 0; i < PR.entityfields; ++i) ent.v_int[i] = 0;
    ent.v_float[PR.entvars.colormap] = ent.num;
    ent.v_float[PR.entvars.team] = (client.colors & 15) + 1;
    ent.v_int[PR.entvars.netname] = PR.netnames + (client.num << 5);
    for (i = 0; i <= 15; ++i)
      PR.globals_float[PR.globalvars.parms + i] = client.spawn_parms[i];
    PR.globals_float[PR.globalvars.time] = SV.server.time;
    PR.globals_int[PR.globalvars.self] = ent.num;
    PR.ExecuteProgram(PR.globals_int[PR.globalvars.ClientConnect]);
    if (Sys.FloatTime() - client.netconnection.connecttime <= SV.server.time)
      Sys.Print(SV.GetClientName(client) + " entered the game\n");
    PR.ExecuteProgram(PR.globals_int[PR.globalvars.PutClientInServer]);

    var message = client.message;
    message.cursize = 0;
    MSG.WriteByte(message, Protocol.svc.time);
    MSG.WriteFloat(message, SV.server.time);
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      MSG.WriteByte(message, Protocol.svc.updatename);
      MSG.WriteByte(message, i);
      MSG.WriteString(message, SV.GetClientName(client));
      MSG.WriteByte(message, Protocol.svc.updatefrags);
      MSG.WriteByte(message, i);
      MSG.WriteShort(message, client.old_frags);
      MSG.WriteByte(message, Protocol.svc.updatecolors);
      MSG.WriteByte(message, i);
      MSG.WriteByte(message, client.colors);
    }
    for (i = 0; i <= 63; ++i) {
      MSG.WriteByte(message, Protocol.svc.lightstyle);
      MSG.WriteByte(message, i);
      MSG.WriteString(message, SV.server.lightstyles[i]);
    }
    MSG.WriteByte(message, Protocol.svc.updatestat);
    MSG.WriteByte(message, Def.stat.totalsecrets);
    MSG.WriteLong(message, PR.globals_float[PR.globalvars.total_secrets]);
    MSG.WriteByte(message, Protocol.svc.updatestat);
    MSG.WriteByte(message, Def.stat.totalmonsters);
    MSG.WriteLong(message, PR.globals_float[PR.globalvars.total_monsters]);
    MSG.WriteByte(message, Protocol.svc.updatestat);
    MSG.WriteByte(message, Def.stat.secrets);
    MSG.WriteLong(message, PR.globals_float[PR.globalvars.found_secrets]);
    MSG.WriteByte(message, Protocol.svc.updatestat);
    MSG.WriteByte(message, Def.stat.monsters);
    MSG.WriteLong(message, PR.globals_float[PR.globalvars.killed_monsters]);
    MSG.WriteByte(message, Protocol.svc.setangle);
    ent = SV.server.edicts[1 + Host.client.num];
    MSG.WriteAngle(message, ent.v_float[PR.entvars.angles]);
    MSG.WriteAngle(message, ent.v_float[PR.entvars.angles1]);
    MSG.WriteAngle(message, 0.0);
    SV.WriteClientdataToMessage(ent, message);
    MSG.WriteByte(message, Protocol.svc.signonnum);
    MSG.WriteByte(message, 3);
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
    var save = Host.client;
    var i, byNumber;
    if (Cmd.argv.length >= 3 && Cmd.argv[1] === "#") {
      i = Q.atoi(Cmd.argv[2]) - 1;
      if (i < 0 || i >= SV.svs.maxclients) return;
      if (SV.svs.clients[i].active !== true) return;
      Host.client = SV.svs.clients[i];
      byNumber = true;
    } else {
      for (i = 0; i < SV.svs.maxclients; ++i) {
        Host.client = SV.svs.clients[i];
        if (Host.client.active !== true) continue;
        if (
          SV.GetClientName(Host.client).toLowerCase() ===
          Cmd.argv[1].toLowerCase()
        )
          break;
      }
    }
    if (i >= SV.svs.maxclients) {
      Host.client = save;
      return;
    }
    var who;
    if (Cmd.client !== true) who = "Console";
    else {
      if (Host.client === save) return;
      who = SV.GetClientName(save);
    }
    var message;
    if (Cmd.argv.length >= 3) message = COM.Parse(Cmd.args);
    if (message != null) {
      var p = 0;
      if (byNumber === true) {
        ++p;
        for (; p < message.length; ++p) {
          if (message.charCodeAt(p) !== 32) break;
        }
        p += Cmd.argv[2].length;
      }
      for (; p < message.length; ++p) {
        if (message.charCodeAt(p) !== 32) break;
      }
      Host.ClientPrint("Kicked by " + who + ": " + message.substring(p) + "\n");
    } else Host.ClientPrint("Kicked by " + who + "\n");
    Host.DropClient();
    Host.client = save;
  },

  Give_f: function () {
    if (Cmd.client !== true) return;
    if (PR.globals_float[PR.globalvars.deathmatch] !== 0) return;
    if (Cmd.argv.length <= 1) return;
    var t = Cmd.argv[1].charCodeAt(0);
    var ent = SV.player;

    if (t >= 48 && t <= 57) {
      if (COM.hipnotic !== true) {
        if (t >= 50)
          ent.v_float[PR.entvars.items] |= Def.it.shotgun << (t - 50);
        return;
      }
      if (t === 54) {
        if (Cmd.argv[1].charCodeAt(1) === 97)
          ent.v_float[PR.entvars.items] |= Def.hit.proximity_gun;
        else ent.v_float[PR.entvars.items] |= Def.it.grenade_launcher;
        return;
      }
      if (t === 57) ent.v_float[PR.entvars.items] |= Def.hit.laser_cannon;
      else if (t === 48) ent.v_float[PR.entvars.items] |= Def.hit.mjolnir;
      else if (t >= 50)
        ent.v_float[PR.entvars.items] |= Def.it.shotgun << (t - 50);
      return;
    }
    var v = Q.atoi(Cmd.argv[2]);
    if (t === 104) {
      ent.v_float[PR.entvars.health] = v;
      return;
    }
    if (COM.rogue !== true) {
      switch (t) {
        case 115:
          ent.v_float[PR.entvars.ammo_shells] = v;
          return;
        case 110:
          ent.v_float[PR.entvars.ammo_nails] = v;
          return;
        case 114:
          ent.v_float[PR.entvars.ammo_rockets] = v;
          return;
        case 99:
          ent.v_float[PR.entvars.ammo_cells] = v;
      }
      return;
    }
    switch (t) {
      case 115:
        if (PR.entvars.ammo_shells1 != null)
          ent.v_float[PR.entvars.ammo_shells1] = v;
        ent.v_float[PR.entvars.ammo_shells] = v;
        return;
      case 110:
        if (PR.entvars.ammo_nails1 != null) {
          ent.v_float[PR.entvars.ammo_nails1] = v;
          if (ent.v_float[PR.entvars.weapon] <= Def.it.lightning)
            ent.v_float[PR.entvars.ammo_nails] = v;
        }
        return;
      case 108:
        if (PR.entvars.ammo_lava_nails != null) {
          ent.v_float[PR.entvars.ammo_lava_nails] = v;
          if (ent.v_float[PR.entvars.weapon] > Def.it.lightning)
            ent.v_float[PR.entvars.ammo_nails] = v;
        }
        return;
      case 114:
        if (PR.entvars.ammo_rockets1 != null) {
          ent.v_float[PR.entvars.ammo_rockets1] = v;
          if (ent.v_float[PR.entvars.weapon] <= Def.it.lightning)
            ent.v_float[PR.entvars.ammo_rockets] = v;
        }
        return;
      case 109:
        if (PR.entvars.ammo_multi_rockets != null) {
          ent.v_float[PR.entvars.ammo_multi_rockets] = v;
          if (ent.v_float[PR.entvars.weapon] > Def.it.lightning)
            ent.v_float[PR.entvars.ammo_rockets] = v;
        }
        return;
      case 99:
        if (PR.entvars.ammo_cells1 != null) {
          ent.v_float[PR.entvars.ammo_cells1] = v;
          if (ent.v_float[PR.entvars.weapon] <= Def.it.lightning)
            ent.v_float[PR.entvars.ammo_cells] = v;
        }
        return;
      case 112:
        if (PR.entvars.ammo_plasma != null) {
          ent.v_float[PR.entvars.ammo_plasma] = v;
          if (ent.v_float[PR.entvars.weapon] > Def.it.lightning)
            ent.v_float[PR.entvars.ammo_cells] = v;
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

module.exports = HostCommands;
