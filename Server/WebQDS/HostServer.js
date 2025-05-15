// Host server-related functions
HostServer = {
  FindMaxClients: function () {
    var i = COM.CheckParm("-maxplayers");
    SV.svs.maxclients = 8;
    if (i != null) {
      ++i;
      if (i < COM.argv.length) {
        SV.svs.maxclients = Q.atoi(COM.argv[i]);
        if (SV.svs.maxclients <= 0) SV.svs.maxclients = 8;
        else if (SV.svs.maxclients > 16) SV.svs.maxclients = 16;
      }
    }
    SV.svs.maxclientslimit = SV.svs.maxclients;
    SV.svs.clients = [];
    for (i = 0; i < SV.svs.maxclientslimit; ++i) {
      SV.svs.clients[i] = {
        num: i,
        message: {
          data: new ArrayBuffer(8000),
          cursize: 0,
          allowoverflow: true,
        },
        colors: 0,
        old_frags: 0,
      };
    }
    if (SV.svs.maxclients > 1) Cvar.SetValue("deathmatch", 1);
    else Cvar.SetValue("deathmatch", 0);
  },

  ShutdownServer: function (crash) {
    if (SV.server.active !== true) return;
    SV.server.active = false;
    var start = Sys.FloatTime(),
      count,
      i;
    do {
      count = 0;
      for (i = 0; i < SV.svs.maxclients; ++i) {
        Host.client = SV.svs.clients[i];
        if (Host.client.active !== true || Host.client.message.cursize === 0)
          continue;
        if (NET.CanSendMessage(Host.client.netconnection) === true) {
          NET.SendMessage(Host.client.netconnection, Host.client.message);
          Host.client.message.cursize = 0;
          continue;
        }
        NET.GetMessage(Host.client.netconnection);
        ++count;
      }
      if (Sys.FloatTime() - start > 3.0) break;
    } while (count !== 0);
    var buf = { data: new ArrayBuffer(4), cursize: 1 };
    new Uint8Array(buf.data)[0] = Protocol.svc.disconnect;
    count = NET.SendToAll(buf);
    if (count !== 0)
      Con.Print(
        "Host.ShutdownServer: NET.SendToAll failed for " + count + " clients\n"
      );
    for (i = 0; i < SV.svs.maxclients; ++i) {
      Host.client = SV.svs.clients[i];
      if (Host.client.active === true) Host.DropClient(crash);
    }
  },

  ServerFrame: function () {
    PR.globals_float[PR.globalvars.frametime] = Host.frametime;
    SV.server.datagram.cursize = 0;
    SV.CheckForNewClients();
    SV.RunClients();
    if (SV.server.paused !== true) SV.Physics();
    SV.SendClientMessages();
  },

  RemoteCommand: function (from, data, password) {
    if (
      Host.rcon_password.string.length === 0 ||
      password !== Host.rcon_password.string
    ) {
      Con.Print("Bad rcon from " + from + ":\n" + data + "\n");
      return;
    }
    Con.Print("Rcon from " + from + ":\n" + data + "\n");
    Cmd.ExecuteString(data);
    return true;
  },

  GetConsoleCommands: function () {
    var cmd;
    for (;;) {
      cmd = Sys.ConsoleInput();
      if (cmd == null) return;
      Cmd.text += cmd;
    }
  },

  DropClient: function (crash) {
    var client = Host.client;
    if (crash !== true) {
      if (NET.CanSendMessage(client.netconnection) === true) {
        MSG.WriteByte(client.message, Protocol.svc.disconnect);
        NET.SendMessage(client.netconnection, client.message);
      }
      if (client.edict != null && client.spawned === true) {
        var saveSelf = PR.globals_int[PR.globalvars.self];
        PR.globals_int[PR.globalvars.self] = client.edict.num;
        PR.ExecuteProgram(PR.globals_int[PR.globalvars.ClientDisconnect]);
        PR.globals_int[PR.globalvars.self] = saveSelf;
      }
      Sys.Print("Client " + SV.GetClientName(client) + " removed\n");
    }
    NET.Close(client.netconnection);
    client.netconnection = null;
    client.active = false;
    SV.SetClientName(client, "");
    client.old_frags = -999999;
    --NET.activeconnections;
    var i,
      num = client.num;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true) continue;
      MSG.WriteByte(client.message, Protocol.svc.updatename);
      MSG.WriteByte(client.message, num);
      MSG.WriteByte(client.message, 0);
      MSG.WriteByte(client.message, Protocol.svc.updatefrags);
      MSG.WriteByte(client.message, num);
      MSG.WriteShort(client.message, 0);
      MSG.WriteByte(client.message, Protocol.svc.updatecolors);
      MSG.WriteByte(client.message, num);
      MSG.WriteByte(client.message, 0);
    }
  },
};

module.exports = HostServer;
