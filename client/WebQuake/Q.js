/* globals: Q Sys */

/**
 * Contains some helper functions to handle strings, int arrays, floats, etc. and conversions between them.
 */
Q = {};

/**
 * Converts a `Uint8` array to string using [String.fromCharCode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode).
 * NOTE: Really not enforced to be exactly that 8 bits int.
 * @param {Uint8Array} src
 * @returns {String}
 */
Q.memstr = function (src) {
  let dest = [];

  for (let i = 0; i < src.length && src[i] !== 0; ++i) {
    dest[i] = String.fromCharCode(src[i]);
  }
  return dest.join("");
};

/**
 * Creates a `Uint8` array from a string (masks out anything > 255).
 * @param {String} src
 * @returns {Uint8Array}
 */
Q.strmem = function (src) {
  const buf = new ArrayBuffer(src.length);
  const dest = new Uint8Array(buf);

  for (let i = 0; i < src.length; ++i) {
    dest[i] = src.charCodeAt(i) & 255;
  }
  return buf;
};

// TODO: check size of int
/**
 * Creates an integer, signed or unsigned, from a string.
 * @param {String} str
 * @returns {Number}
 */
Q.atoi = function (str) {
  if (str == null) return 0;

  let ptr,
    val = 0,
    sign,
    c,
    c2;

  // 45: `-`
  if (str.charCodeAt(0) === 45) {
    sign = -1;
    ptr = 1;
  } else {
    sign = 1;
    ptr = 0;
  }

  c = str.charCodeAt(ptr);
  c2 = str.charCodeAt(ptr + 1);
  //  48: `0`
  // 120: `x`
  //  88: `X`
  // Hex value
  if (c === 48 && (c2 === 120 || c2 === 88)) {
    ptr += 2;
    for (;;) {
      c = str.charCodeAt(ptr++);
      // [48,57]: [0,9]
      if (c >= 48 && c <= 57) val = (val << 4) + c - 48;
      // [97,102]: [a,f]
      else if (c >= 97 && c <= 102) val = (val << 4) + c - 87;
      // [65,70]: [A,F]
      else if (c >= 65 && c <= 70) val = (val << 4) + c - 55;
      else return val * sign;
    }
  }

  // 39: `'`
  if (c === 39) {
    if (Q.isNaN(c2) === true) return 0;
    return sign * c2;
  }

  for (;;) {
    c = str.charCodeAt(ptr++);
    // [48,57]: [0,9]
    if (Q.isNaN(c) === true || c <= 47 || c >= 58) return val * sign;
    val = val * 10 + c - 48;
  }
};

/**
 * Creates a float from a string.
 * @param {String} str
 * @returns {Number} Float (signed or unsigned)
 */
Q.atof = function (str) {
  if (str == null) return 0.0;

  let ptr, val, sign, c, c2;

  // 45: `-`
  if (str.charCodeAt(0) === 45) {
    sign = -1.0;
    ptr = 1;
  } else {
    sign = 1.0;
    ptr = 0;
  }

  c = str.charCodeAt(ptr);
  c2 = str.charCodeAt(ptr + 1);
  //  48: `0`
  // 120: `x`
  //  88: `X`
  // Hex value
  if (c === 48 && (c2 === 120 || c2 === 88)) {
    ptr += 2;
    val = 0.0;
    for (;;) {
      c = str.charCodeAt(ptr++);
      // [48,57]: [0,9]
      if (c >= 48 && c <= 57) val = val * 16.0 + c - 48;
      // [97,102]: [a,f]
      else if (c >= 97 && c <= 102) val = val * 16.0 + c - 87;
      // [65,70]: [A,F]
      else if (c >= 65 && c <= 70) val = val * 16.0 + c - 55;
      else return val * sign;
    }
  }

  // 39: `'`
  if (c === 39) {
    if (Q.isNaN(c2) === true) return 0.0;
    return sign * c2;
  }

  val = parseFloat(str);
  if (Q.isNaN(val) === true) return 0.0;
  return val;
};

/**
 * Decodes a Base64-encoded string.
 * @param {String} src
 * @returns {String}
 */
Q.btoa = function (src) {
  const str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let val = [];
  let len = src.length - (src.length % 3);
  let c;

  for (let i = 0; i < len; i += 3) {
    c = (src[i] << 16) + (src[i + 1] << 8) + src[i + 2];
    val[val.length] =
      str.charAt(c >> 18) +
      str.charAt((c >> 12) & 63) +
      str.charAt((c >> 6) & 63) +
      str.charAt(c & 63);
  }
  if (src.length - len === 1) {
    c = src[len];
    val[val.length] = str.charAt(c >> 2) + str.charAt((c & 3) << 4) + "==";
  } else if (src.length - len === 2) {
    c = (src[len] << 8) + src[len + 1];
    val[val.length] =
      str.charAt(c >> 10) +
      str.charAt((c >> 4) & 63) +
      str.charAt((c & 15) << 2) +
      "=";
  }
  return val.join("");
};

/**
 * Q.isNaN -> added by Sys.js
 */
