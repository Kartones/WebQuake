/**
 * Vector operations
 */

const sharedVec = require("../../shared/Vec.js");

Vec = {};

Vec.origin = sharedVec.origin;
Vec.Anglemod = sharedVec.Anglemod;
Vec.BoxOnPlaneSide = sharedVec.BoxOnPlaneSide;
Vec.AngleVectors = sharedVec.AngleVectors;
Vec.CrossProduct = sharedVec.CrossProduct;
Vec.Length = sharedVec.Length;
Vec.Normalize = sharedVec.Normalize;

Vec.Perpendicular = function (v) {
  let pos = 0;
  let minelem = 1;
  if (Math.abs(v[0]) < minelem) {
    pos = 0;
    minelem = Math.abs(v[0]);
  }
  if (Math.abs(v[1]) < minelem) {
    pos = 1;
    minelem = Math.abs(v[1]);
  }
  if (Math.abs(v[2]) < minelem) {
    pos = 2;
    minelem = Math.abs(v[2]);
  }
  const tempvec = [0.0, 0.0, 0.0];
  tempvec[pos] = 1.0;
  const inv_denom = 1.0 / (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  const d =
    (tempvec[0] * v[0] + tempvec[1] * v[1] + tempvec[2] * v[2]) * inv_denom;
  let dst = [
    tempvec[0] - d * v[0] * inv_denom,
    tempvec[1] - d * v[1] * inv_denom,
    tempvec[2] - d * v[2] * inv_denom,
  ];
  Vec.Normalize(dst);
  return dst;
};

Vec.RotatePointAroundVector = function (dir, point, degrees) {
  const r = Vec.Perpendicular(dir);
  const up = Vec.CrossProduct(r, dir);
  const m = [
    [r[0], up[0], dir[0]],
    [r[1], up[1], dir[1]],
    [r[2], up[2], dir[2]],
  ];
  const im = [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
  const s = Math.sin((degrees * Math.PI) / 180.0);
  const c = Math.cos((degrees * Math.PI) / 180.0);
  const zrot = [
    [c, s, 0],
    [-s, c, 0],
    [0, 0, 1],
  ];
  const rot = Vec.ConcatRotations(Vec.ConcatRotations(m, zrot), im);
  return [
    rot[0][0] * point[0] + rot[0][1] * point[1] + rot[0][2] * point[2],
    rot[1][0] * point[0] + rot[1][1] * point[1] + rot[1][2] * point[2],
    rot[2][0] * point[0] + rot[2][1] * point[1] + rot[2][2] * point[2],
  ];
};

Vec.DotProduct = function (v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
};

/**
 * Copies the values from vector v1 to vector v2.
 * @param {number[]} v1 - Source vector.
 * @param {number[]} v2 - Destination vector. This array will be modified.
 */
Vec.Copy = function (v1, v2) {
  v2[0] = v1[0];
  v2[1] = v1[1];
  v2[2] = v1[2];
};

Vec.ConcatRotations = function (m1, m2) {
  return [
    [
      m1[0][0] * m2[0][0] + m1[0][1] * m2[1][0] + m1[0][2] * m2[2][0],
      m1[0][0] * m2[0][1] + m1[0][1] * m2[1][1] + m1[0][2] * m2[2][1],
      m1[0][0] * m2[0][2] + m1[0][1] * m2[1][2] + m1[0][2] * m2[2][2],
    ],
    [
      m1[1][0] * m2[0][0] + m1[1][1] * m2[1][0] + m1[1][2] * m2[2][0],
      m1[1][0] * m2[0][1] + m1[1][1] * m2[1][1] + m1[1][2] * m2[2][1],
      m1[1][0] * m2[0][2] + m1[1][1] * m2[1][2] + m1[1][2] * m2[2][2],
    ],
    [
      m1[2][0] * m2[0][0] + m1[2][1] * m2[1][0] + m1[2][2] * m2[2][0],
      m1[2][0] * m2[0][1] + m1[2][1] * m2[1][1] + m1[2][2] * m2[2][1],
      m1[2][0] * m2[0][2] + m1[2][1] * m2[1][2] + m1[2][2] * m2[2][2],
    ],
  ];
};
