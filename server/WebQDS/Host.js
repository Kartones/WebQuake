require("./HostClient.js");
require("./HostServer.js");
require("./HostCommands.js");

Host = {
  framecount: 0,
  inerror: false,
  realtime: 0.0,
  oldrealtime: 0.0,
  frametime: 0.0,
  timetotal: 0.0,
  timecount: 0,
  noclip_anglehack: false,
  client: null,
  framerate: 0,
  speeds: 0,
  rcon_password: "",
  ticrate: 0.05,
  serverprofile: 0,
  fraglimit: 0,
  timelimit: 0,
  teamplay: 0,
  samelevel: 0,
  noexit: 0,
  skill: 1,
  developer: 0,
  deathmatch: 0,
  coop: 0,
  pausable: 1,
  temp1: 0,

  Error: HostClient.Error,
  ClientPrint: HostClient.ClientPrint,
  BroadcastPrint: HostClient.BroadcastPrint,

  FindMaxClients: HostServer.FindMaxClients,
  ShutdownServer: HostServer.ShutdownServer,
  ServerFrame: HostServer.ServerFrame,
  RemoteCommand: HostServer.RemoteCommand,
  GetConsoleCommands: HostServer.GetConsoleCommands,
  DropClient: HostServer.DropClient,

  Status_f: HostCommands.Status_f,
  Quit_f: HostCommands.Quit_f,
  God_f: HostCommands.God_f,
  Notarget_f: HostCommands.Notarget_f,
  Noclip_f: HostCommands.Noclip_f,
  Fly_f: HostCommands.Fly_f,
  Ping_f: HostCommands.Ping_f,
  Map_f: HostCommands.Map_f,
  Changelevel_f: HostCommands.Changelevel_f,
  Restart_f: HostCommands.Restart_f,
  Name_f: HostCommands.Name_f,
  Version_f: HostCommands.Version_f,
  Say: HostCommands.Say,
  Say_Team_f: HostCommands.Say_Team_f,
  Tell_f: HostCommands.Tell_f,
  Color_f: HostCommands.Color_f,
  Kill_f: HostCommands.Kill_f,
  Pause_f: HostCommands.Pause_f,
  PreSpawn_f: HostCommands.PreSpawn_f,
  Spawn_f: HostCommands.Spawn_f,
  Begin_f: HostCommands.Begin_f,
  Kick_f: HostCommands.Kick_f,
  Give_f: HostCommands.Give_f,
  Startdemos_f: HostCommands.Startdemos_f,
  InitCommands: HostCommands.InitCommands,

  InitLocal: function () {
    Host.InitCommands();
    Host.framerate = Cvar.RegisterVariable("host_framerate", "0");
    Host.speeds = Cvar.RegisterVariable("host_speeds", "0");
    Host.rcon_password = Cvar.RegisterVariable("rcon_password", "");
    Sys.Print(
      `rcon_password: ${Host.rcon_password.value} ${Host.rcon_password.string} ${Host.rcon_password.string.length}\n`
    );
    Host.ticrate = Cvar.RegisterVariable("sys_ticrate", "0.05");
    Host.serverprofile = Cvar.RegisterVariable("serverprofile", "0");
    Host.fraglimit = Cvar.RegisterVariable("fraglimit", "0", false, true);
    Host.timelimit = Cvar.RegisterVariable("timelimit", "0", false, true);
    Host.teamplay = Cvar.RegisterVariable("teamplay", "0", false, true);
    Host.samelevel = Cvar.RegisterVariable("samelevel", "0");
    Host.noexit = Cvar.RegisterVariable("noexit", "0", false, true);
    Host.skill = Cvar.RegisterVariable("skill", "1");
    Host.developer = Cvar.RegisterVariable("developer", "0");
    Host.deathmatch = Cvar.RegisterVariable("deathmatch", "0");
    Host.coop = Cvar.RegisterVariable("coop", "0");
    Host.pausable = Cvar.RegisterVariable("pausable", "1");
    Host.temp1 = Cvar.RegisterVariable("temp1", "0");
    Host.FindMaxClients();
  },

  _processFrame: function () {
    Math.random();

    Host.realtime = Sys.FloatTime();
    Host.frametime = Host.realtime - Host.oldrealtime;
    Host.oldrealtime = Host.realtime;
    if (Host.framerate.value > 0) Host.frametime = Host.framerate.value;
    else {
      if (Host.frametime > 0.1) Host.frametime = 0.1;
      else if (Host.frametime < 0.001) Host.frametime = 0.001;
    }
    Cmd.Execute();
    if (SV.server.active === true) Host.ServerFrame();
    Host.GetConsoleCommands();
    ++Host.framecount;
  },

  _processFrameWithProfiling: function () {
    const startTime = Sys.FloatTime();
    Host._processFrame();
    Host.timetotal += Sys.FloatTime() - startTime;
    if (++Host.timecount <= 999) return;

    const avgTimeMs = ((Host.timetotal * 1000.0) / Host.timecount) >> 0;
    Host.timecount = 0;
    Host.timetotal = 0.0;

    let clientIndex,
      activeClientCount = 0;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      if (SV.svs.clients[clientIndex].active === true) ++activeClientCount;
    }

    Con.Print(
      "serverprofile: " +
        (activeClientCount <= 9 ? " " : "") +
        activeClientCount +
        " clients " +
        (avgTimeMs <= 9 ? " " : "") +
        avgTimeMs +
        " msec\n"
    );
  },

  Frame: function () {
    setTimeout(Host.Frame, Host.ticrate.value * 1000.0);
    if (Host.serverprofile.value === 0) {
      Host._processFrame();
    } else {
      Host._processFrameWithProfiling();
    }
  },

  Init: function () {
    Host.oldrealtime = Sys.FloatTime();
    Cmd.Init();
    V.Init();
    COM.Init();
    Host.InitLocal();
    PR.Init();
    Mod.Init();
    NET.Init();
    SV.Init();
    Cmd.text = "exec quake.rc\n" + Cmd.text;
    Sys.Print("========Quake Initialized=========\n");
  },
};
