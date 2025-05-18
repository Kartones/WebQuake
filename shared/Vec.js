/**
 * Vector operations
 */

const Vec = {
  origin: [0.0, 0.0, 0.0],

  Anglemod: function (a) {
    return ((a % 360.0) + 360.0) % 360.0;
  },

  BoxOnPlaneSide: function (emins, emaxs, p) {
    if (p.type <= 2) {
      if (p.dist <= emins[p.type]) return 1;
      if (p.dist >= emaxs[p.type]) return 2;
      return 3;
    }
    let dist1, dist2;
    switch (p.signbits) {
      case 0:
        dist1 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emaxs[2];
        dist2 =
          p.normal[0] * emins[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emins[2];
        break;
      case 1:
        dist1 =
          p.normal[0] * emins[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emaxs[2];
        dist2 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emins[2];
        break;
      case 2:
        dist1 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emaxs[2];
        dist2 =
          p.normal[0] * emins[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emins[2];
        break;
      case 3:
        dist1 =
          p.normal[0] * emins[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emaxs[2];
        dist2 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emins[2];
        break;
      case 4:
        dist1 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emins[2];
        dist2 =
          p.normal[0] * emins[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emaxs[2];
        break;
      case 5:
        dist1 =
          p.normal[0] * emins[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emins[2];
        dist2 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emaxs[2];
        break;
      case 6:
        dist1 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emins[2];
        dist2 =
          p.normal[0] * emins[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emaxs[2];
        break;
      case 7:
        dist1 =
          p.normal[0] * emins[0] +
          p.normal[1] * emins[1] +
          p.normal[2] * emins[2];
        dist2 =
          p.normal[0] * emaxs[0] +
          p.normal[1] * emaxs[1] +
          p.normal[2] * emaxs[2];
        break;
      default:
        Sys.Error("Vec.BoxOnPlaneSide: Bad signbits");
    }
    let sides = 0;
    if (dist1 >= p.dist) sides = 1;
    if (dist2 < p.dist) sides += 2;
    return sides;
  },

  /**
   * Computes forward, right, and up vectors from the given angles.
   * @param {number[]} angles - The angles array [pitch, yaw, roll] in degrees.
   * @param {number[]} forward - Output parameter: forward vector will be stored here. This array will be modified.
   * @param {number[]} right - Output parameter: right vector will be stored here. This array will be modified.
   * @param {number[]} up - Output parameter: up vector will be stored here. This array will be modified.
   */
  AngleVectors: function (angles, forward, right, up) {
    let angle;

    angle = (angles[0] * Math.PI) / 180.0;
    const sp = Math.sin(angle);
    const cp = Math.cos(angle);
    angle = (angles[1] * Math.PI) / 180.0;
    const sy = Math.sin(angle);
    const cy = Math.cos(angle);
    angle = (angles[2] * Math.PI) / 180.0;
    const sr = Math.sin(angle);
    const cr = Math.cos(angle);

    if (forward != null) {
      forward[0] = cp * cy;
      forward[1] = cp * sy;
      forward[2] = -sp;
    }
    if (right != null) {
      right[0] = cr * sy - sr * sp * cy;
      right[1] = -sr * sp * sy - cr * cy;
      right[2] = -sr * cp;
    }
    if (up != null) {
      up[0] = cr * sp * cy + sr * sy;
      up[1] = cr * sp * sy - sr * cy;
      up[2] = cr * cp;
    }
  },

  CrossProduct: function (v1, v2) {
    return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
  },

  Length: function (v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  },

  /**
   * Normalizes the given vector in place.
   * @param {number[]} v - The vector to normalize. This array will be modified.
   * @returns {number} The original length of the vector before normalization.
   */
  Normalize: function (v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length === 0.0) {
      v[0] = v[1] = v[2] = 0.0;
      return 0.0;
    }
    v[0] /= length;
    v[1] /= length;
    v[2] /= length;
    return length;
  },
};

module.exports = Vec;
