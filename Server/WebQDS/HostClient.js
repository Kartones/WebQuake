// Host client communication functions
HostClient = {
  ClientPrint: function (string) {
    MSG.WriteByte(Host.client.message, Protocol.svc.print);
    MSG.WriteString(Host.client.message, string);
  },

  BroadcastPrint: function (string) {
    var i, client;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true || client.spawned !== true) continue;
      MSG.WriteByte(client.message, Protocol.svc.print);
      MSG.WriteString(client.message, string);
    }
  },

  Error: function (error) {
    if (Host.inerror === true) Sys.Error("Host.Error: recursively entered");
    Host.inerror = true;
    error = "Host.Error: " + error + "\n";
    Con.Print(error);
    Sys.Error(error);
  },
};

module.exports = HostClient;
