/* globals: Def */

/**
 * Some basic definitions
 */

// Refactored from the original source code, so that shared definitions can be used
let ClientDef = {};

// Running in a browser environment
if (typeof window !== "undefined" && window.Def) {
  const sharedDef = window.Def;
  Object.assign(ClientDef, sharedDef);
  // WebQuake engine version number
  ClientDef.webquake_version = 54;
  // version release date string
  ClientDef.timedate = "August 2021\n";
} else if (typeof require !== "undefined") {
  // Node.js environment fallback (unused at the moment)
  const sharedDef = require("../../shared/Def.js");
  Object.assign(ClientDef, sharedDef);
  // WebQuake engine version number
  ClientDef.webquake_version = 54;
  // version release date string
  ClientDef.timedate = "August 2021\n";
}
