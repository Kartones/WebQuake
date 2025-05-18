WEBS = {};

WEBS.acceptsockets = [];
WEBS.colors = [];
WEBS.templates = {};

WEBS.Init = function () {
  const palette = COM.LoadFile("gfx/palette.lmp");
  if (palette == null) Sys.Error("Couldn't load gfx/palette.lmp");
  const paletteData = new Uint8Array(palette);
  let colorIndex;
  let sourceByte = 24;

  for (colorIndex = 0; colorIndex <= 13; ++colorIndex) {
    WEBS.colors[colorIndex] = `${paletteData[sourceByte]},${
      paletteData[sourceByte + 1]
    },${paletteData[sourceByte + 2]}`;
    sourceByte += 48;
  }

  let serverStatusTemplate, playerRowTemplate;
  try {
    serverStatusTemplate = Node.fs.readFileSync(
      "server/WebQDS/server-status.template",
      "utf8"
    );
  } catch (e) {
    Sys.Error(
      "Couldn't load server/WebQDS/server-status.template: " + e.message
    );
    return false;
  }

  try {
    playerRowTemplate = Node.fs.readFileSync(
      "server/WebQDS/player-row.template",
      "utf8"
    );
  } catch (e) {
    Sys.Error("Couldn't load server/WebQDS/player-row.template: " + e.message);
    return false;
  }

  WEBS.templates.serverStatus = serverStatusTemplate;
  WEBS.templates.playerRow = playerRowTemplate;

  WEBS.server = new Node.websocket.server();
  WEBS.server.on("request", WEBS.ServerOnRequest);

  return true;
};

WEBS.Listen = function () {
  if (NET.listening !== true) {
    WEBS.server.unmount();
    if (WEBS.http == null) return;
    WEBS.http.close();
    WEBS.http = null;
    return;
  }
  try {
    WEBS.http = Node.http.createServer();
    WEBS.http.listen(NET.hostport);
    WEBS.http.on("request", WEBS.HTTPOnRequest);
    WEBS.server.mount({ httpServer: WEBS.http, maxReceivedMessageSize: 8192 });
  } catch (e) {
    NET.listening = false;
    return;
  }
};

WEBS.CheckNewConnections = function () {
  if (WEBS.acceptsockets.length === 0) return;
  const socket = NET.NewQSocket();
  const connection = WEBS.acceptsockets.shift();
  socket.driverdata = connection;
  socket.receiveMessage = [];
  socket.address = connection.socket.remoteAddress;
  connection.data_socket = socket;
  connection.on("message", WEBS.ConnectionOnMessage);
  connection.on("close", WEBS.ConnectionOnClose);
  return socket;
};

WEBS.GetMessage = function (sock) {
  if (sock.driverdata == null) return -1;
  if (sock.driverdata.closeReasonCode !== -1) return -1;
  if (sock.receiveMessage.length === 0) return 0;
  const messageData = sock.receiveMessage.shift();
  const destBuffer = new Uint8Array(NET.message.data);
  NET.message.cursize = messageData.length - 1;

  for (let i = 1; i < messageData.length; ++i) {
    destBuffer[i - 1] = messageData[i];
  }
  return messageData[0];
};

WEBS.SendMessage = function (sock, data) {
  if (sock.driverdata == null) return -1;
  if (sock.driverdata.closeReasonCode !== -1) return -1;
  const sourceData = new Uint8Array(data.data);
  const destBuffer = Buffer.alloc(data.cursize + 1);

  destBuffer[0] = 1;
  for (let i = 0; i < data.cursize; ++i) {
    destBuffer[i + 1] = sourceData[i];
  }
  sock.driverdata.sendBytes(destBuffer);
  return 1;
};

WEBS.SendUnreliableMessage = function (sock, data) {
  if (sock.driverdata == null) return -1;
  if (sock.driverdata.closeReasonCode !== -1) return -1;
  const sourceData = new Uint8Array(data.data);
  const destBuffer = Buffer.alloc(data.cursize + 1);

  destBuffer[0] = 2;
  for (let i = 0; i < data.cursize; ++i) {
    destBuffer[i + 1] = sourceData[i];
  }
  sock.driverdata.sendBytes(destBuffer);
  return 1;
};

WEBS.CanSendMessage = function (sock) {
  if (sock.driverdata == null) return;
  if (sock.driverdata.closeReasonCode === -1) return true;
};

WEBS.Close = function (sock) {
  if (sock.driverdata == null) return;
  if (sock.driverdata.closeReasonCode !== -1) return;
  sock.driverdata.drop(1000);
  sock.driverdata = null;
};

WEBS.ConnectionOnMessage = function (message) {
  if (message.type !== "binary") return;
  if (message.binaryData.length > 8000) return;
  this.data_socket.receiveMessage.push(message.binaryData);
};

WEBS.ConnectionOnClose = function () {
  NET.Close(this.data_socket);
};

WEBS.HTMLSpecialChars = function (str) {
  const outputChars = [];
  let charCode;

  for (let i = 0; i < str.length; ++i) {
    charCode = str.charCodeAt(i);
    switch (charCode) {
      case 38:
        outputChars[outputChars.length] = "&amp;";
        continue;
      case 60:
        outputChars[outputChars.length] = "&lt;";
        continue;
      case 62:
        outputChars[outputChars.length] = "&gt;";
        continue;
    }
    outputChars[outputChars.length] = String.fromCharCode(charCode);
  }
  return outputChars.join("");
};

WEBS._clientDetails = function (client, currentTime) {
  const playerName = WEBS.HTMLSpecialChars(SV.GetClientName(client));
  const shirtColor = WEBS.colors[client.colors >> 4];
  const pantsColor = WEBS.colors[client.colors & 15];
  const shirtNum = (client.colors >> 4).toString();
  const pantsNum = (client.colors & 15).toString();
  const frags = client.edict.v_float[PR.entvars.frags].toFixed(0);
  const connectionTime = Math.floor(
    currentTime - client.netconnection.connecttime
  );
  const formattedTime = `${Math.floor(connectionTime / 60.0)}:${Math.floor(
    connectionTime % 60.0
  )
    .toString()
    .padStart(2, "0")}`;
  return {
    playerName,
    shirtColor,
    pantsColor,
    shirtNum,
    pantsNum,
    frags,
    formattedTime,
  };
};

WEBS._renderTemplate = function (template, replacements) {
  let result = template;
  Object.keys(replacements).forEach((key) => {
    result = result.replace(new RegExp(`%${key}%`, "g"), replacements[key]);
  });
  return result;
};

WEBS.HTTPOnRequest = function (request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 200;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Authorization");
    response.end();
    return;
  }
  const isHeadRequest = request.method === "HEAD";
  if (request.method !== "GET" && isHeadRequest !== true) {
    response.statusCode = 501;
    response.end();
    return;
  }
  const pathSegments = Node.url.parse(request.url).pathname.split("/");
  let pathName = "";
  if (pathSegments.length >= 2) pathName = pathSegments[1].toLowerCase();

  let textArray;

  if (pathName.length === 0) {
    if (SV.server.active !== true) {
      response.statusCode = 503;
      response.end();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html; charset=UTF-8");
    if (isHeadRequest === true) {
      response.end();
      return;
    }
    const hostname = WEBS.HTMLSpecialChars(NET.hostname.string);
    const headerContent = `${hostname} - ${WEBS.HTMLSpecialChars(
      PR.GetString(PR.globals_int[PR.globalvars.mapname])
    )} (${NET.activeconnections.toString()}/${SV.svs.maxclients.toString()})`;

    let playerRows = "";
    const currentTime = Sys.FloatTime();

    for (let i = 0, client; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true) continue;

      const clientDetails = WEBS._clientDetails(client, currentTime);
      const playerRow = WEBS._renderTemplate(
        WEBS.templates.playerRow,
        clientDetails
      );
      playerRows += playerRow;
    }

    const htmlContent = WEBS._renderTemplate(WEBS.templates.serverStatus, {
      hostname: hostname,
      headerContent: headerContent,
      playerRows: playerRows,
    });

    response.end(htmlContent);
    return;
  }
  if (pathName === "server_info") {
    if (SV.server.active !== true) {
      response.statusCode = 503;
      response.end();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=UTF-8");
    if (isHeadRequest === true) response.end();
    else {
      response.end(
        JSON.stringify({
          hostName: NET.hostname.string,
          levelName: PR.GetString(PR.globals_int[PR.globalvars.mapname]),
          currentPlayers: NET.activeconnections,
          maxPlayers: SV.svs.maxclients,
          protocolVersion: 2,
        })
      );
    }
    return;
  }
  if (pathName === "player_info") {
    if (SV.server.active !== true) {
      response.statusCode = 503;
      response.end();
      return;
    }
    let client;
    if (pathSegments.length <= 2 || pathSegments[2] === "") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=UTF-8");
      response.write("[");
      textArray = [];
      for (let i = 0; i < SV.svs.maxclients; ++i) {
        client = SV.svs.clients[i];
        if (client.active !== true) continue;
        textArray[textArray.length] = JSON.stringify({
          name: SV.GetClientName(client),
          colors: client.colors,
          frags: client.edict.v_float[PR.entvars.frags] >> 0,
          connectTime: Sys.FloatTime() - client.netconnection.connecttime,
          address: client.netconnection.address,
        });
      }
      response.write(textArray.join(","));
      response.end("]");
      return;
    }
    const playerNumber = Q.atoi(pathSegments[2]);
    let activePlayerIndex = -1;
    let i;
    for (i = 0; i < SV.svs.maxclients; ++i) {
      client = SV.svs.clients[i];
      if (client.active !== true) continue;
      if (++activePlayerIndex === playerNumber) break;
    }
    if (i === SV.svs.maxclients) {
      response.statusCode = 404;
      response.end();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=UTF-8");
    if (isHeadRequest === true) {
      response.end();
      return;
    }
    response.end(
      JSON.stringify({
        name: SV.GetClientName(client),
        colors: client.colors,
        frags: client.edict.v_float[PR.entvars.frags] >> 0,
        connectTime: Sys.FloatTime() - client.netconnection.connecttime,
        address: client.netconnection.address,
      })
    );
    return;
  }
  if (pathName === "rule_info") {
    let ruleName, cvarEntry;
    if (pathSegments.length >= 3) {
      ruleName = pathSegments[2].toLowerCase();
      if (ruleName.length !== 0) {
        for (let i = 0; i < Cvar.vars.length; ++i) {
          cvarEntry = Cvar.vars[i];
          if (cvarEntry.server !== true) continue;
          if (cvarEntry.name !== ruleName) continue;
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=UTF-8");
          if (isHeadRequest === true) response.end();
          else
            response.end(
              JSON.stringify({ rule: cvarEntry.name, value: cvarEntry.string })
            );
          return;
        }
        response.statusCode = 404;
        response.end();
        return;
      }
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=UTF-8");
    if (isHeadRequest === true) {
      response.end();
      return;
    }
    response.write("[");
    textArray = [];
    for (let i = 0; i < Cvar.vars.length; ++i) {
      cvarEntry = Cvar.vars[i];
      if (cvarEntry.server === true)
        textArray[textArray.length] = JSON.stringify({
          rule: cvarEntry.name,
          value: cvarEntry.string,
        });
    }
    response.write(textArray.join(","));
    response.end("]");
    return;
  }
  if (pathName === "rcon") {
    let commandData;
    try {
      commandData = decodeURIComponent(pathSegments.slice(2).join("/")).split(
        "\n"
      )[0];
    } catch (e) {
      response.statusCode = 400;
      response.end();
      return;
    }
    if (commandData.length === 0) {
      response.statusCode = 400;
      response.end();
      return;
    }
    if (request.headers.authorization == null) {
      response.statusCode = 401;
      response.setHeader("WWW-Authenticate", 'Basic realm="Quake"');
      response.end();
      return;
    }
    let authHeader = request.headers.authorization;
    if (authHeader.substring(0, 6) !== "Basic ") {
      response.statusCode = 403;
      response.end();
      return;
    }
    try {
      authHeader = Buffer.from(authHeader.substring(6), "base64").toString(
        "ascii"
      );
    } catch (e) {
      response.statusCode = 403;
      response.end();
      return;
    }
    if (authHeader.substring(0, 6) !== "quake:") {
      response.statusCode = 403;
      response.end();
      return;
    }
    response.statusCode =
      Host.RemoteCommand(
        request.connection.remoteAddress,
        commandData,
        authHeader.substring(6)
      ) === true
        ? 200
        : 403;
    response.end();
    return;
  }
  response.statusCode = 404;
  response.end();
};

WEBS.ServerOnRequest = function (request) {
  if (SV.server.active !== true) {
    request.reject();
    return;
  }
  if (request.requestedProtocols[0] !== Def.socket_protocol_id) {
    request.reject();
    return;
  }
  if (NET.activeconnections + WEBS.acceptsockets.length >= SV.svs.maxclients) {
    request.reject();
    return;
  }

  let socket;
  for (let i = 0; i < NET.activeSockets.length; ++i) {
    socket = NET.activeSockets[i];
    if (socket.disconnected === true) continue;
    if (NET.drivers[socket.driver] !== WEBS) continue;
    if (request.remoteAddress !== socket.address) continue;
    NET.Close(socket);
    break;
  }
  WEBS.acceptsockets.push(request.accept("quake", request.origin));
};
