/* globals: CL */

/**
 * CL_Init - Client initialization module.
 */

/**
 * Initialize the client module.
 */
CL.Init = function (command_m, cvar_m) {
  CL._ClearState();
  CL._InitInput();
  CL._InitTEnts();
  CL.name = cvar_m.RegisterVariable("_cl_name", "player", true);
  CL.color = cvar_m.RegisterVariable("_cl_color", "0", true);
  CL.upspeed = cvar_m.RegisterVariable("cl_upspeed", "200");
  CL.forwardspeed = cvar_m.RegisterVariable("cl_forwardspeed", "200", true);
  CL.backspeed = cvar_m.RegisterVariable("cl_backspeed", "200", true);
  CL.sidespeed = cvar_m.RegisterVariable("cl_sidespeed", "350");
  CL.movespeedkey = cvar_m.RegisterVariable("cl_movespeedkey", "2.0");
  CL.yawspeed = cvar_m.RegisterVariable("cl_yawspeed", "140");
  CL.pitchspeed = cvar_m.RegisterVariable("cl_pitchspeed", "150");
  CL.anglespeedkey = cvar_m.RegisterVariable("cl_anglespeedkey", "1.5");
  CL.shownet = cvar_m.RegisterVariable("cl_shownet", "0");
  CL.nolerp = cvar_m.RegisterVariable("cl_nolerp", "0");
  CL.lookspring = cvar_m.RegisterVariable("lookspring", "0", true);
  CL.lookstrafe = cvar_m.RegisterVariable("lookstrafe", "0", true);
  CL.sensitivity = cvar_m.RegisterVariable("sensitivity", "3", true);
  CL.m_pitch = cvar_m.RegisterVariable("m_pitch", "0.022", true);
  CL.m_yaw = cvar_m.RegisterVariable("m_yaw", "0.022", true);
  CL.m_forward = cvar_m.RegisterVariable("m_forward", "1", true);
  CL.m_side = cvar_m.RegisterVariable("m_side", "0.8", true);
  CL.rcon_password = cvar_m.RegisterVariable("rcon_password", "");
  CL.rcon_address = cvar_m.RegisterVariable("rcon_address", "");
  command_m.AddCommand("entities", CL._PrintEntities_f);
  command_m.AddCommand("rcon", CL._Rcon_f);
  command_m.AddCommand("disconnect", CL.Disconnect);
  command_m.AddCommand("record", CL._Record_f);
  command_m.AddCommand("stop", CL._Stop_f);
  command_m.AddCommand("playdemo", CL._PlayDemo_f);
  command_m.AddCommand("timedemo", CL._TimeDemo_f);
};
