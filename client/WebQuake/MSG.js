/**
 * Handles reading and writing messages.
 * Reads from NET.message, writes specified `sb` buffer
 */

MSG = {};

/**
 * Writes a signed 8-bit character to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {number} c - The character value to write
 */
MSG.WriteChar = function (sb, c) {
  new DataView(sb.data).setInt8(SZ.GetSpace(sb, 1), c);
};

/**
 * Writes an unsigned 8-bit byte to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {number} c - The byte value to write
 */
MSG.WriteByte = function (sb, c) {
  new DataView(sb.data).setUint8(SZ.GetSpace(sb, 1), c);
};

/**
 * Writes a signed 16-bit short to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {number} c - The short value to write
 */
MSG.WriteShort = function (sb, c) {
  new DataView(sb.data).setInt16(SZ.GetSpace(sb, 2), c, true);
};

/**
 * Writes a signed 32-bit long to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {number} c - The long value to write
 */
MSG.WriteLong = function (sb, c) {
  new DataView(sb.data).setInt32(SZ.GetSpace(sb, 4), c, true);
};

/**
 * Writes a 32-bit float to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {number} f - The float value to write
 */
MSG.WriteFloat = function (sb, f) {
  new DataView(sb.data).setFloat32(SZ.GetSpace(sb, 4), f, true);
};

/**
 * Writes a null-terminated string to the message buffer.
 * @param {Object} sb - The message buffer object
 * @param {string} s - The string to write
 */
MSG.WriteString = function (sb, s) {
  if (s != null) SZ.Write(sb, new Uint8Array(Q.strmem(s)), s.length);
  MSG.WriteChar(sb, 0);
};

/**
 * Writes a coordinate value (quantized as short divided by 8.0).
 * @param {Object} sb - The message buffer object
 * @param {number} f - The coordinate value to write
 */
MSG.WriteCoord = function (sb, f) {
  MSG.WriteShort(sb, f * 8.0);
};

/**
 * Writes an angle value (quantized as byte in 0-255 range).
 * @param {Object} sb - The message buffer object
 * @param {number} f - The angle in degrees
 */
MSG.WriteAngle = function (sb, f) {
  MSG.WriteByte(sb, ((f >> 0) * (256.0 / 360.0)) & 255);
};

/**
 * Initializes message reading state.
 * Resets the read counter and clears the bad read flag.
 */
MSG.BeginReading = function () {
  MSG.readcount = 0;
  MSG.badread = false;
};

/**
 * Reads a signed 8-bit character from the message.
 * @returns {number} The character value, or -1 if read overflows
 */
MSG.ReadChar = function () {
  if (MSG.readcount >= NET.message.cursize) {
    MSG.badread = true;
    return -1;
  }
  var c = new Int8Array(NET.message.data, MSG.readcount, 1)[0];
  ++MSG.readcount;
  return c;
};

/**
 * Reads an unsigned 8-bit byte from the message.
 * @returns {number} The byte value, or -1 if read overflows
 */
MSG.ReadByte = function () {
  if (MSG.readcount >= NET.message.cursize) {
    MSG.badread = true;
    return -1;
  }
  var c = new Uint8Array(NET.message.data, MSG.readcount, 1)[0];
  ++MSG.readcount;
  return c;
};

/**
 * Reads a signed 16-bit short from the message.
 * @returns {number} The short value, or -1 if read overflows
 */
MSG.ReadShort = function () {
  if (MSG.readcount + 2 > NET.message.cursize) {
    MSG.badread = true;
    return -1;
  }
  var c = new DataView(NET.message.data).getInt16(MSG.readcount, true);
  MSG.readcount += 2;
  return c;
};

/**
 * Reads a signed 32-bit long from the message.
 * @returns {number} The long value, or -1 if read overflows
 */
MSG.ReadLong = function () {
  if (MSG.readcount + 4 > NET.message.cursize) {
    MSG.badread = true;
    return -1;
  }
  var c = new DataView(NET.message.data).getInt32(MSG.readcount, true);
  MSG.readcount += 4;
  return c;
};

/**
 * Reads a 32-bit float from the message.
 * @returns {number} The float value, or -1 if read overflows
 */
MSG.ReadFloat = function () {
  if (MSG.readcount + 4 > NET.message.cursize) {
    MSG.badread = true;
    return -1;
  }
  var f = new DataView(NET.message.data).getFloat32(MSG.readcount, true);
  MSG.readcount += 4;
  return f;
};

/**
 * Reads a null-terminated string from the message.
 * @returns {string} The string value
 */
MSG.ReadString = function () {
  var string = [],
    l,
    c;
  for (l = 0; l < 2048; ++l) {
    c = MSG.ReadByte();
    if (c <= 0) break;
    string[l] = String.fromCharCode(c);
  }
  return string.join("");
};

/**
 * Reads a coordinate value (quantized short multiplied by 0.125).
 * @returns {number} The coordinate value
 */
MSG.ReadCoord = function () {
  return MSG.ReadShort() * 0.125;
};

/**
 * Reads an angle value (quantized byte converted from 0-255 range).
 * @returns {number} The angle in degrees
 */
MSG.ReadAngle = function () {
  return MSG.ReadChar() * 1.40625;
};
