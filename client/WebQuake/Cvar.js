/* globals: Cmd Con Host Q SV */

/**
 * Console variables (cvars) - configuration settings and game state variables.
 */
Cvar = {};

// array of all registered console variables
Cvar.vars = [];

// Extra logging that appears outside the game (e.g. in the browser console)
Cvar.verbose_logging = false;

/**
 * Find a cvar by name.
 * @param {string} name - The cvar name.
 * @returns {object|undefined} The cvar object if found.
 */
Cvar.FindVar = function (name) {
  var i;
  for (i = 0; i < Cvar.vars.length; ++i) {
    if (Cvar.vars[i].name === name) return Cvar.vars[i];
  }
};

/**
 * Get cvar name completion for partial name.
 * @param {string} partial - Partial cvar name.
 * @returns {string|undefined} The completed cvar name if found.
 */
Cvar.CompleteVariable = function (partial) {
  if (partial.length === 0) return;
  var i;
  for (i = 0; i < Cvar.vars.length; ++i) {
    if (Cvar.vars[i].name.substring(0, partial.length) === partial)
      return Cvar.vars[i].name;
  }
};

/**
 * Set a cvar value by name.
 * @param {string} name - The cvar name.
 * @param {string} value - The value to set.
 */
Cvar.Set = function (name, value) {
  var i, v, changed;
  for (i = 0; i < Cvar.vars.length; ++i) {
    v = Cvar.vars[i];
    if (v.name !== name) continue;
    if (v.string !== value) changed = true;
    v.string = value;
    v.value = Q.atof(value);
    if (v.server === true && changed === true && SV.server.active === true)
      Host.BroadcastPrint('"' + v.name + '" changed to "' + v.string + '"\n');
    return;
  }
  Con.Print("Cvar.Set: variable " + name + " not found\n");
};

/**
 * Set a cvar to a numeric value.
 * @param {string} name - The cvar name.
 * @param {number} value - The numeric value to set.
 */
Cvar.SetValue = function (name, value) {
  Cvar.Set(name, value.toFixed(6));
};

/**
 * Register a new cvar.
 * @param {string} name - The cvar name.
 * @param {string} value - The initial value.
 * @param {boolean} archive - Whether to archive in config file.
 * @param {boolean} server - Whether it's a server cvar.
 * @returns {object} The registered cvar object.
 */
Cvar.RegisterVariable = function (name, value, archive, server) {
  var i;
  for (i = 0; i < Cvar.vars.length; ++i) {
    if (Cvar.vars[i].name === name) {
      Con.Print("Can't register variable " + name + ", allready defined\n");
      return;
    }
  }
  Cvar.vars[Cvar.vars.length] = {
    // name of the console variable
    name: name,
    // string value of the variable
    string: value,
    // whether to save in config file
    archive: archive,
    // whether this is a server-side variable
    server: server,
    // numeric value converted from string
    value: Q.atof(value),
  };
  return Cvar.vars[Cvar.vars.length - 1];
};

/**
 * Handle cvar command from console.
 * @returns {boolean} True if a cvar command was executed.
 */
Cvar.Command = function () {
  var v = Cvar.FindVar(Cmd.argv[0]);
  if (v == null) return;
  if (Cmd.argv.length <= 1) {
    Con.Print('"' + v.name + '" is "' + v.string + '"\n');
    return true;
  }
  Cvar.Set(v.name, Cmd.argv[1]);
  return true;
};

/**
 * Write cvars marked for archiving to config file.
 */
Cvar.WriteVariables = function () {
  var f = [],
    i,
    v;
  for (i = 0; i < Cvar.vars.length; ++i) {
    v = Cvar.vars[i];
    if (v.archive === true) f[f.length] = v.name + ' "' + v.string + '"\n';
  }
  return f.join("");
};
