/**
 * Legacy video driver functions. Most of it probably wiped out as doesn't applies to WebQuake.
 */

VID = {};

VID.d_8to24table = new Uint32Array(new ArrayBuffer(1024));

/**
 * SetPalette function.
 */
VID.SetPalette = function () {
  const palette = COM.LoadFile("gfx/palette.lmp");
  if (palette == null) Sys.Error("Couldn't load gfx/palette.lmp");
  const paletteArray = new Uint8Array(palette);
  var sourceIndex = 0;
  for (let i = 0; i < 256; ++i) {
    VID.d_8to24table[i] =
      paletteArray[sourceIndex] +
      (paletteArray[sourceIndex + 1] << 8) +
      (paletteArray[sourceIndex + 2] << 16);
    sourceIndex += 3;
  }
};

/**
 * Init function.
 */
VID.Init = function () {
  document.getElementById("progress").style.display = "none";
  GL.Init();
  VID.SetPalette();
};
