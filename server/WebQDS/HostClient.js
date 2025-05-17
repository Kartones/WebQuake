// Host client communication functions
const HostClient = {
  ClientPrint: function (message) {
    MSG.WriteByte(Host.client.message, Protocol.svc.print);
    MSG.WriteString(Host.client.message, message);
  },

  BroadcastPrint: function (message) {
    let clientIndex, client;
    for (clientIndex = 0; clientIndex < SV.svs.maxclients; ++clientIndex) {
      client = SV.svs.clients[clientIndex];
      if (client.active !== true || client.spawned !== true) continue;
      MSG.WriteByte(client.message, Protocol.svc.print);
      MSG.WriteString(client.message, message);
    }
  },

  Error: function (error) {
    if (Host.inerror === true) Sys.Error("Host.Error: recursively entered");
    Host.inerror = true;
    const errorMessage = "Host.Error: " + error + "\n";
    Con.Print(errorMessage);
    Sys.Error(errorMessage);
  },
};

module.exports = HostClient;
