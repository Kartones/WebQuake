// Host server-related functions
HostServer = {
  FindMaxClients: function () {
    const maxPlayersArgIndex = COM.CheckParm("-maxplayers");
    SV.svs.maxclients = 8;
    if (maxPlayersArgIndex != null) {
      const valueIndex = maxPlayersArgIndex + 1;
      if (valueIndex < COM.argv.length) {
        SV.svs.maxclients = Q.atoi(COM.argv[valueIndex]);
        if (SV.svs.maxclients <= 0) SV.svs.maxclients = 8;
        else if (SV.svs.maxclients > 16) SV.svs.maxclients = 16;
      }
    }
    SV.svs.maxclientslimit = SV.svs.maxclients;
    SV.svs.clients = [];
    for (
      let clientIndex = 0;
      clientIndex < SV.svs.maxclientslimit;
      ++clientIndex
    ) {
      SV.svs.clients[clientIndex] = {
        num: clientIndex,
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
    const startTime = Sys.FloatTime();
    let pendingMessageCount;
    let clientIndex;
    do {
      pendingMessageCount = 0;
      for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
        Host.client = SV.svs.clients[clientIndex];
        if (Host.client.active !== true || Host.client.message.cursize === 0)
          continue;
        if (NET.CanSendMessage(Host.client.netconnection) === true) {
          NET.SendMessage(Host.client.netconnection, Host.client.message);
          Host.client.message.cursize = 0;
          continue;
        }
        NET.GetMessage(Host.client.netconnection);
        ++pendingMessageCount;
      }
      if (Sys.FloatTime() - startTime > 3.0) break;
    } while (pendingMessageCount !== 0);
    const disconnectBuffer = { data: new ArrayBuffer(4), cursize: 1 };
    new Uint8Array(disconnectBuffer.data)[0] = Protocol.svc.disconnect;
    const failedClientCount = NET.SendToAll(disconnectBuffer);
    if (failedClientCount !== 0)
      Con.Print(
        "Host.ShutdownServer: NET.SendToAll failed for " +
          failedClientCount +
          " clients\n"
      );
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      Host.client = SV.svs.clients[clientIndex];
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
    let command;
    for (;;) {
      command = Sys.ConsoleInput();
      if (command == null) return;
      Cmd.text += command;
    }
  },

  DropClient: function (crash) {
    const client = Host.client;
    if (crash !== true) {
      if (NET.CanSendMessage(client.netconnection) === true) {
        MSG.WriteByte(client.message, Protocol.svc.disconnect);
        NET.SendMessage(client.netconnection, client.message);
      }
      if (client.edict != null && client.spawned === true) {
        const saveSelf = PR.globals_int[PR.globalvars.self];
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
    let currentClientIndex;
    const clientNumber = client.num;
    for (
      currentClientIndex = 0;
      currentClientIndex < SV.svs.maxclients;
      ++currentClientIndex
    ) {
      const currentClient = SV.svs.clients[currentClientIndex];
      if (currentClient.active !== true) continue;
      MSG.WriteByte(currentClient.message, Protocol.svc.updatename);
      MSG.WriteByte(currentClient.message, clientNumber);
      MSG.WriteByte(currentClient.message, 0);
      MSG.WriteByte(currentClient.message, Protocol.svc.updatefrags);
      MSG.WriteByte(currentClient.message, clientNumber);
      MSG.WriteShort(currentClient.message, 0);
      MSG.WriteByte(currentClient.message, Protocol.svc.updatecolors);
      MSG.WriteByte(currentClient.message, clientNumber);
      MSG.WriteByte(currentClient.message, 0);
    }
  },
};
