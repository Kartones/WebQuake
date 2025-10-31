/* globals: COM Q Sys W */

/**
 * Provides access to WAD (Where's All the Data) resource files.
 */
W = {};

// array of loaded WAD lumps indexed by name
W.lumps = [];

/**
 * Load a WAD file and cache its lumps.
 * @param {string} filename - The WAD file name to load
 * @throws {Error} If file cannot be loaded or is not a valid WAD2 file
 */
W.LoadWadFile = function (filename) {
  var base = COM.LoadFile(filename);
  if (base == null) Sys.Error("W.LoadWadFile: couldn't load " + filename);
  var view = new DataView(base);
  if (view.getUint32(0, true) !== 0x32444157)
    Sys.Error("Wad file " + filename + " doesn't have WAD2 id");
  var numlumps = view.getUint32(4, true);
  var infotableofs = view.getUint32(8, true);
  var i, size, lump;
  for (i = 0; i < numlumps; ++i) {
    size = view.getUint32(infotableofs + 4, true);
    lump = new ArrayBuffer(size);
    new Uint8Array(lump).set(
      new Uint8Array(base, view.getUint32(infotableofs, true), size)
    );
    W.lumps[
      Q.memstr(new Uint8Array(base, infotableofs + 16, 16)).toUpperCase()
    ] = lump;
    infotableofs += 32;
  }
};

/**
 * Retrieve a loaded lump by name.
 * @param {string} name - The lump name
 * @returns {ArrayBuffer} The lump data
 * @throws {Error} If lump not found
 */
W.GetLumpName = function (name) {
  var lump = W.lumps[name];
  if (lump == null) Sys.Error("W.GetLumpName: " + name + " not found");
  return lump;
};
