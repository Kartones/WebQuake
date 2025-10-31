/* globals: CL */

/**
 * CL_Light - Dynamic lighting management.
 * Handles allocation and decay of dynamic lights.
 */

/**
 * Allocate a dynamic light.
 * @param {number} key - Unique identifier for the light.
 * @returns {object} The allocated light object.
 */
CL.AllocDlight = function (key) {
  let i, dl;
  if (key !== 0) {
    for (i = 0; i <= 31; ++i) {
      if (CL.dlights[i].key === key) {
        dl = CL.dlights[i];
        break;
      }
    }
  }
  if (dl == null) {
    for (i = 0; i <= 31; ++i) {
      if (CL.dlights[i].die < CL.state.time) {
        dl = CL.dlights[i];
        break;
      }
    }
    if (dl == null) dl = CL.dlights[0];
  }
  dl.origin = [0.0, 0.0, 0.0];
  dl.radius = 0.0;
  dl.die = 0.0;
  dl.decay = 0.0;
  dl.minlight = 0.0;
  dl.key = key;
  return dl;
};

/**
 * Update dynamic light decay over time.
 */
CL.DecayLights = function () {
  let i,
    dl,
    time = CL.state.time - CL.state.oldtime;
  for (i = 0; i <= 31; ++i) {
    dl = CL.dlights[i];
    if (dl.die < CL.state.time || dl.radius === 0.0) continue;
    dl.radius -= time * dl.decay;
    if (dl.radius < 0.0) dl.radius = 0.0;
  }
};
