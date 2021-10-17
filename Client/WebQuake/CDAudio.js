/* globals Cmd COM Con Cvar Q S */

/**
 * Music logic. Legacy name, as WebQuake uses ogg music files if present
 */
const CDAudio = {
  initialized: false,
  known: [],
  cd: undefined,
  playTrack: null,
  enabled: false,
  cdvolume: 0.0,

  Init() {
    Cmd.AddCommand('cd', CDAudio.CD_f);
    if (COM.CheckParm('-nocdaudio') != null) {
      return;
    }
    const xhr = new XMLHttpRequest();
    for (let i = 1, foundAnyTrack = true; i <= 99 && foundAnyTrack; ++i) {
      foundAnyTrack = false;
      const track = `/media/quake${i <= 9 ? '0' : ''}${i}.ogg`;
      for (let j = COM.searchpaths.length - 1; j >= 0; --j) {
        xhr.open('HEAD', COM.searchpaths[j].filename + track, false);
        xhr.send();
        if ((xhr.status >= 200) && (xhr.status <= 299)) {
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
    Con.Print('CD Audio Initialized\n');
  },

  Play(track, looping) {
    if ((CDAudio.initialized !== true) || (CDAudio.enabled !== true)) {
      return;
    }
    const trackNumber = track - 2;
    if (CDAudio.playTrack === trackNumber) {
      if (CDAudio.cd != null) {
        CDAudio.cd.loop = looping;
        if ((looping === true) && (CDAudio.cd.paused === true)) {
          CDAudio.cd.play();
        }
      }
      return;
    }
    if ((trackNumber < 0) || (trackNumber >= CDAudio.known.length)) {
      Con.DPrint(`CDAudio.Play: Bad track number ${track}.\n`);
    } else {
      CDAudio.Stop();
      CDAudio.playTrack = trackNumber;
      CDAudio.cd = new Audio(CDAudio.known[trackNumber]);
      CDAudio.cd.loop = looping;
      CDAudio.cd.volume = CDAudio.cdvolume;
      CDAudio.cd.play();
    }
  },

  Stop() {
    if ((CDAudio.initialized !== true) || (CDAudio.enabled !== true)) {
      return;
    }
    if (CDAudio.cd != null) { CDAudio.cd.pause(); }
    CDAudio.playTrack = null;
    CDAudio.cd = null;
  },

  Pause() {
    if ((CDAudio.initialized !== true) || (CDAudio.enabled !== true)) {
      return;
    }
    if (CDAudio.cd != null) {
      CDAudio.cd.pause();
    }
  },

  Resume() {
    if ((CDAudio.initialized !== true) || (CDAudio.enabled !== true)) {
      return;
    }
    if (CDAudio.cd != null) {
      CDAudio.cd.play();
    }
  },

  Update() {
    if ((CDAudio.initialized !== true) || (CDAudio.enabled !== true)) {
      return;
    }
    if (S.bgmvolume.value === CDAudio.cdvolume) {
      return;
    }
    if (S.bgmvolume.value < 0.0) {
      Cvar.SetValue('bgmvolume', 0.0);
    } else if (S.bgmvolume.value > 1.0) {
      Cvar.SetValue('bgmvolume', 1.0);
    }
    CDAudio.cdvolume = S.bgmvolume.value;
    if (CDAudio.cd != null) {
      CDAudio.cd.volume = CDAudio.cdvolume;
    }
  },

  CD_f() {
    if ((CDAudio.initialized !== true) || (Cmd.argv.length <= 1)) {
      return;
    }
    const command = Cmd.argv[1].toLowerCase();
    switch (command) {
      case 'on':
        CDAudio.enabled = true;
        return;
      case 'off':
        CDAudio.Stop();
        CDAudio.enabled = false;
        return;
      case 'play':
        CDAudio.Play(Q.atoi(Cmd.argv[2]), false);
        return;
      case 'loop':
        CDAudio.Play(Q.atoi(Cmd.argv[2]), true);
        return;
      case 'stop':
        CDAudio.Stop();
        return;
      case 'pause':
        CDAudio.Pause();
        return;
      case 'resume':
        CDAudio.Resume();
        return;
      case 'info':
        Con.Print(`${CDAudio.known.length} tracks\n`);
        if (CDAudio.cd != null) {
          if (CDAudio.cd.paused !== true) {
            Con.Print(`Currently ${CDAudio.cd.loop === true ? 'looping' : 'playing'} track ${CDAudio.playTrack + 2}\n`);
          }
        }
        Con.Print(`Volume is ${CDAudio.cdvolume}\n`);
        return;
      default:
        throw new Error(`Unknown command ${command}`);
    }
  }
};
