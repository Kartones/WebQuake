/* globals: Cmd COM Con Cvar Q S */

/**
 * Music logic. Legacy name, as WebQuake uses ogg music files if present
 */
const CDAudio = {
  // whether the CD audio system has been initialized
  initialized: false,
  // array of known music track file paths indexed by track number
  known: [],
  // currently playing audio element
  cd: undefined,
  // currently playing track number or null if none
  playTrack: null,
  // whether CD audio playback is enabled
  enabled: false,
  // current volume level for CD audio (0.0 to 1.0)
  cdvolume: 0.0,

  /**
   * Initialize the CD audio system by scanning for available music tracks.
   */
  Init() {
    Cmd.AddCommand("cd", CDAudio.CD_f);
    if (COM.CheckParm("-nocdaudio") != null) {
      return;
    }
    const xhr = new XMLHttpRequest();
    // Fix: as with the original Quake, audio tracks start at 2 (1 is the data track)
    for (let i = 2, foundAnyTrack = true; i <= 99 && foundAnyTrack; ++i) {
      foundAnyTrack = false;
      const track = `/music/track${i <= 9 ? "0" : ""}${i}.ogg`;
      for (let j = COM.searchpaths.length - 1; j >= 0; --j) {
        xhr.open("HEAD", COM.searchpaths[j].filename + track, false);
        xhr.send();
        if (xhr.status >= 200 && xhr.status <= 299) {
          // index is 0-based, while track numbers start at 1
          CDAudio.known[i - 1] = COM.searchpaths[j].filename + track;
          foundAnyTrack = true;
          break;
        }
      }
    }
    if (CDAudio.known.length === 0) {
      return;
    }
    CDAudio.initialized = true;
    CDAudio.enabled = true;
    CDAudio.Update();
    Con.Print("CD Audio Initialized\n");
  },

  _PlayWithErrorHandling() {
    CDAudio.cd.play().catch(() => {
      if (Cvar.verbose_logging === true) {
        Sys.Print(
          "CDAudio.Play: Autoplay not allowed (user interaction required).\n"
        );
      }
    });
  },

  /**
   * Play a CD audio track.
   * @param {number} track - The track number to play.
   * @param {boolean} looping - Whether the track should loop.
   */
  Play(track, looping) {
    if (CDAudio.initialized !== true || CDAudio.enabled !== true) {
      return;
    }
    // -2 because track index is 0-based and first track is the data track, so track numbering starts at 2
    const trackNumber = track - 2;
    if (CDAudio.playTrack === trackNumber) {
      if (CDAudio.cd != null) {
        CDAudio.cd.loop = looping;
        if (looping === true && CDAudio.cd.paused === true) {
          CDAudio._PlayWithErrorHandling();
        }
      }
      return;
    }
    if (trackNumber < 0 || trackNumber >= CDAudio.known.length) {
      Con.DPrint(`CDAudio.Play: Bad track number ${track}.\n`);
    } else {
      CDAudio.Stop();
      CDAudio.playTrack = trackNumber;
      CDAudio.cd = new Audio(CDAudio.known[trackNumber]);
      CDAudio.cd.loop = looping;
      CDAudio.cd.volume = CDAudio.cdvolume;
      CDAudio._PlayWithErrorHandling();
    }
    if (trackNumber < 0 || trackNumber >= CDAudio.known.length) {
      Con.DPrint(`CDAudio.Play: Bad track number ${track}.\n`);
    } else {
      CDAudio.Stop();
      CDAudio.playTrack = trackNumber;
      CDAudio.cd = new Audio(CDAudio.known[trackNumber]);
      CDAudio.cd.loop = looping;
      CDAudio.cd.volume = CDAudio.cdvolume;
      CDAudio._PlayWithErrorHandling();
    }
  },

  /**
   * Stop the currently playing CD audio track.
   */
  Stop() {
    if (CDAudio.initialized !== true || CDAudio.enabled !== true) {
      return;
    }
    if (CDAudio.cd != null) {
      CDAudio.cd.pause();
    }
    CDAudio.playTrack = null;
    CDAudio.cd = null;
  },

  /**
   * Pause the currently playing CD audio track.
   */
  Pause() {
    if (CDAudio.initialized !== true || CDAudio.enabled !== true) {
      return;
    }
    if (CDAudio.cd != null) {
      CDAudio.cd.pause();
    }
  },

  /**
   * Resume playback of the paused CD audio track.
   */
  Resume() {
    if (CDAudio.initialized !== true || CDAudio.enabled !== true) {
      return;
    }
    if (CDAudio.cd != null) {
      CDAudio.cd.play().catch(() => {
        if (Cvar.verbose_logging === true) {
          Sys.Print(
            "CDAudio.Play: Autoplay not allowed (user interaction required).\n"
          );
        }
      });
    }
  },

  /**
   * Update the CD audio volume based on the bgmvolume cvar.
   */
  Update() {
    if (CDAudio.initialized !== true || CDAudio.enabled !== true) {
      return;
    }
    if (S.bgmvolume.value === CDAudio.cdvolume) {
      return;
    }
    if (S.bgmvolume.value < 0.0) {
      Cvar.SetValue("bgmvolume", 0.0);
    } else if (S.bgmvolume.value > 1.0) {
      Cvar.SetValue("bgmvolume", 1.0);
    }
    CDAudio.cdvolume = S.bgmvolume.value;
    if (CDAudio.cd != null) {
      CDAudio.cd.volume = CDAudio.cdvolume;
    }
  },

  /**
   * Console command handler for CD audio controls (on, off, play, loop, stop, pause, resume, info).
   */
  CD_f() {
    if (CDAudio.initialized !== true || Cmd.argv.length <= 1) {
      return;
    }
    const command = Cmd.argv[1].toLowerCase();
    switch (command) {
      case "on":
        CDAudio.enabled = true;
        return;
      case "off":
        CDAudio.Stop();
        CDAudio.enabled = false;
        return;
      case "play":
        CDAudio.Play(Q.atoi(Cmd.argv[2]), false);
        return;
      case "loop":
        CDAudio.Play(Q.atoi(Cmd.argv[2]), true);
        return;
      case "stop":
        CDAudio.Stop();
        return;
      case "pause":
        CDAudio.Pause();
        return;
      case "resume":
        CDAudio.Resume();
        return;
      case "info":
        Con.Print(`${CDAudio.known.length} tracks\n`);
        if (CDAudio.cd != null) {
          if (CDAudio.cd.paused !== true) {
            // +2 because track index is 0-based and first track is the data track, so track numbering starts at 2
            Con.Print(
              `Currently ${
                CDAudio.cd.loop === true ? "looping" : "playing"
              } track ${CDAudio.playTrack + 2}\n`
            );
          }
        }
        Con.Print(`Volume is ${CDAudio.cdvolume}\n`);
        return;
      default:
        throw new Error(`Unknown command ${command}`);
    }
  },
};
