/* globals: Con Sys SZ */

/**
 * Remains of WinQuake's Zones & Hunk? As JS doesn't needs to allocate memory
 */

SZ = {};

/**
 * Allocates space in a buffer for writing data.
 * @param {Object} buf - The buffer object with cursize and data properties
 * @param {number} length - The amount of space to allocate
 * @returns {number} The current size before allocation
 * @throws {Error} If overflow occurs without allowoverflow flag set or if requested length exceeds buffer capacity
 */
SZ.GetSpace = function (buf, length) {
  if (buf.cursize + length > buf.data.byteLength) {
    if (buf.allowoverflow !== true)
      Sys.Error("SZ.GetSpace: overflow without allowoverflow set");
    if (length > buf.byteLength)
      Sys.Error("SZ.GetSpace: " + length + " is > full buffer size");
    buf.overflowed = true;
    Con.Print("SZ.GetSpace: overflow\n");
    buf.cursize = 0;
  }
  const cursize = buf.cursize;
  buf.cursize += length;
  return cursize;
};

/**
 * Writes byte data to a buffer.
 * @param {Object} sb - The source buffer object
 * @param {Uint8Array} data - The data to write
 * @param {number} length - The number of bytes to write
 */
SZ.Write = function (sb, data, length) {
  new Uint8Array(sb.data, SZ.GetSpace(sb, length), length).set(
    data.subarray(0, length)
  );
};

/**
 * Writes a string to a buffer as character codes.
 * @param {Object} sb - The source buffer object
 * @param {string} data - The string data to write
 */
SZ.Print = function (sb, data) {
  var buf = new Uint8Array(sb.data);
  var dest;
  if (sb.cursize !== 0) {
    if (buf[sb.cursize - 1] === 0) dest = SZ.GetSpace(sb, data.length - 1) - 1;
    else dest = SZ.GetSpace(sb, data.length);
  } else dest = SZ.GetSpace(sb, data.length);
  var i;
  for (i = 0; i < data.length; ++i) buf[dest + i] = data.charCodeAt(i);
};
