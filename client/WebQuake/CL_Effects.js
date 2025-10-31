/* globals: Mod MSG CL Protocol R S Sys */

/**
 * CL_Effects - Temporary entities and visual effects.
 * Handles parsing and rendering of temporary entities like beams, explosions, and particles.
 */

// Temporary entities ("tent") related
CL.temp_entities = [];

/**
 * InitTEnts function. Precaches some sounds (used by temporary entities?).
 */
CL.InitTEnts = function () {
  CL.sfx_wizhit = S.PrecacheSound("wizard/hit.wav");
  CL.sfx_knighthit = S.PrecacheSound("hknight/hit.wav");
  CL.sfx_tink1 = S.PrecacheSound("weapons/tink1.wav");
  CL.sfx_ric1 = S.PrecacheSound("weapons/ric1.wav");
  CL.sfx_ric2 = S.PrecacheSound("weapons/ric2.wav");
  CL.sfx_ric3 = S.PrecacheSound("weapons/ric3.wav");
  CL.sfx_r_exp3 = S.PrecacheSound("weapons/r_exp3.wav");
};

/**
 * Parse beam temporary entity.
 * @param {object} m - Message object.
 */
CL.ParseBeam = function (m) {
  let ent = MSG.ReadShort();
  let start = [MSG.ReadCoord(), MSG.ReadCoord(), MSG.ReadCoord()];
  let end = [MSG.ReadCoord(), MSG.ReadCoord(), MSG.ReadCoord()];
  let i, b;
  for (i = 0; i <= 23; ++i) {
    b = CL.beams[i];
    if (b.entity !== ent) continue;
    b.model = m;
    b.endtime = CL.state.time + 0.2;
    b.start = [start[0], start[1], start[2]];
    b.end = [end[0], end[1], end[2]];
    return;
  }
  for (i = 0; i <= 23; ++i) {
    b = CL.beams[i];
    if (b.model != null && b.endtime >= CL.state.time) continue;
    b.entity = ent;
    b.model = m;
    b.endtime = CL.state.time + 0.2;
    b.start = [start[0], start[1], start[2]];
    b.end = [end[0], end[1], end[2]];
    return;
  }
  Con.Print("beam list overflow!\n");
};

/**
 * Parse temporary entity from server.
 */
CL.ParseTEnt = function () {
  let type = MSG.ReadByte();

  switch (type) {
    case Protocol.te.lightning1:
      CL.ParseBeam(Mod.ForName("progs/bolt.mdl", true));
      return;
    case Protocol.te.lightning2:
      CL.ParseBeam(Mod.ForName("progs/bolt2.mdl", true));
      return;
    case Protocol.te.lightning3:
      CL.ParseBeam(Mod.ForName("progs/bolt3.mdl", true));
      return;
    case Protocol.te.beam:
      CL.ParseBeam(Mod.ForName("progs/beam.mdl", true));
      return;
  }

  let pos = [MSG.ReadCoord(), MSG.ReadCoord(), MSG.ReadCoord()];
  let dl;
  switch (type) {
    case Protocol.te.wizspike:
      R.RunParticleEffect(pos, ClientVec.origin, 20, 20);
      S.StartSound(-1, 0, CL.sfx_wizhit, pos, 1.0, 1.0);
      return;
    case Protocol.te.knightspike:
      R.RunParticleEffect(pos, ClientVec.origin, 226, 20);
      S.StartSound(-1, 0, CL.sfx_knighthit, pos, 1.0, 1.0);
      return;
    case Protocol.te.spike:
      R.RunParticleEffect(pos, ClientVec.origin, 0, 10);
      return;
    case Protocol.te.superspike:
      R.RunParticleEffect(pos, ClientVec.origin, 0, 20);
      return;
    case Protocol.te.gunshot:
      R.RunParticleEffect(pos, ClientVec.origin, 0, 20);
      return;
    case Protocol.te.explosion:
      R.ParticleExplosion(pos);
      dl = CL.AllocDlight(0);
      dl.origin = [pos[0], pos[1], pos[2]];
      dl.radius = 350.0;
      dl.die = CL.state.time + 0.5;
      dl.decay = 300.0;
      S.StartSound(-1, 0, CL.sfx_r_exp3, pos, 1.0, 1.0);
      return;
    case Protocol.te.tarexplosion:
      R.BlobExplosion(pos);
      S.StartSound(-1, 0, CL.sfx_r_exp3, pos, 1.0, 1.0);
      return;
    case Protocol.te.lavasplash:
      R.LavaSplash(pos);
      return;
    case Protocol.te.teleport:
      R.TeleportSplash(pos);
      return;
    case Protocol.te.explosion2:
      let colorStart = MSG.ReadByte();
      let colorLength = MSG.ReadByte();
      R.ParticleExplosion2(pos, colorStart, colorLength);
      dl = CL.AllocDlight(0);
      dl.origin = [pos[0], pos[1], pos[2]];
      dl.radius = 350.0;
      dl.die = CL.state.time + 0.5;
      dl.decay = 300.0;
      S.StartSound(-1, 0, CL.sfx_r_exp3, pos, 1.0, 1.0);
      return;
  }

  Sys.Error("CL.ParseTEnt: bad type");
};

/**
 * Create a new temporary entity.
 * @returns {object} The new temporary entity.
 */
CL.NewTempEntity = function () {
  let ent = { frame: 0, syncbase: 0.0, skinnum: 0 };
  CL.temp_entities[CL.num_temp_entities++] = ent;
  CL.visedicts[CL.numvisedicts++] = ent;
  return ent;
};

/**
 * Update temporary entities.
 */
CL.UpdateTEnts = function () {
  CL.num_temp_entities = 0;
  let i,
    b,
    dist = [],
    yaw,
    pitch,
    org = [],
    d,
    ent;
  for (i = 0; i <= 23; ++i) {
    b = CL.beams[i];
    if (b.model == null || b.endtime < CL.state.time) continue;
    if (b.entity === CL.state.viewentity)
      ClientVec.Copy(CL.entities[CL.state.viewentity].origin, b.start);
    dist[0] = b.end[0] - b.start[0];
    dist[1] = b.end[1] - b.start[1];
    dist[2] = b.end[2] - b.start[2];
    if (dist[0] === 0.0 && dist[1] === 0.0) {
      yaw = 0;
      pitch = dist[2] > 0.0 ? 90 : 270;
    } else {
      yaw = ((Math.atan2(dist[1], dist[0]) * 180.0) / Math.PI) >> 0;
      if (yaw < 0) yaw += 360;
      pitch =
        ((Math.atan2(
          dist[2],
          Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1])
        ) *
          180.0) /
          Math.PI) >>
        0;
      if (pitch < 0) pitch += 360;
    }
    org[0] = b.start[0];
    org[1] = b.start[1];
    org[2] = b.start[2];
    d = Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1] + dist[2] * dist[2]);
    if (d !== 0.0) {
      dist[0] /= d;
      dist[1] /= d;
      dist[2] /= d;
    }
    for (; d > 0.0; ) {
      ent = CL.NewTempEntity();
      ent.origin = [org[0], org[1], org[2]];
      ent.model = b.model;
      ent.angles = [pitch, yaw, Math.random() * 360.0];
      org[0] += dist[0] * 30.0;
      org[1] += dist[1] * 30.0;
      org[2] += dist[2] * 30.0;
      d -= 30.0;
    }
  }
};
