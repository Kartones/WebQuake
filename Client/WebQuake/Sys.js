/**
 * Equivalent to sys_win.c
 */

Sys = {};

Sys.events = ['onbeforeunload', 'oncontextmenu', 'onfocus', 'onkeydown', 'onkeyup', 'onmousedown', 'onmouseup', 'onmousewheel', 'onunload', 'onwheel'];

/**
 * Quits the game
 */
Sys.Quit = function() {
    Sys._onQuit();

    VID.mainwindow.style.display = 'none';
	if (COM.registered.value !== 0) {
		document.getElementById('end2').style.display = 'inline';
	} else {
		document.getElementById('end1').style.display = 'inline';
    }
	throw new Error;
};

/**
 * Overriden at window.onload if environment has a console
 */
Sys.Print = function() { /* NOP */ };

/**
 * Quits the game, from an error state, displaying the error message
 * @param {String} text
 */
Sys.Error = function(text) {
    Sys._onQuit();

    let i = Con.text.length - 25;
	if (i < 0) {
		i = 0;
    }
	if (Sys._hasConsole()) {
		for (; i < Con.text.length; ++i)
			console.log(Con.text[i].text);
	}
	alert(text);
	throw new Error(text);
};

Sys.FloatTime = function() {
	return Date.now() * 0.001 - Sys.oldtime;
};

window.onload = function()
{
	if (Number.isNaN != null)
		Q.isNaN = Number.isNaN;
	else
		Q.isNaN = isNaN;

    if (Sys._hasConsole()) {
        Sys.Print = (text) => {
            console.log(text);
        };
    }

	let i;

    // Sample: http://127.0.0.1:8080/index.htm?"-nocdaudio" "+exec autoexec2.cfg"
	const cmdline = decodeURIComponent(document.location.search);
	const location = document.location;
	const argv = [location.href.substring(0, location.href.length - location.search.length)];
	if (cmdline.charCodeAt(0) === 63)
	{
		let text = '';
		let quotes = false;
		let c;

		for (i = 1; i < cmdline.length; ++i)
		{
			c = cmdline.charCodeAt(i);
            // "safe part" of ASCII-7
			if ((c < 32) || (c > 127)) {
				continue;
            }
            // double quotes `"`
			if (c === 34) {
				quotes = !quotes;
				continue;
			}
            // space ` `
			if ((quotes === false) && (c === 32)) {
				if (text.length === 0)
					continue;
				argv[argv.length] = text;
				text = '';
				continue;
			}
			text += cmdline.charAt(i);
		}
		if (text.length !== 0) {
            argv[argv.length] = text;
        }
	}
	COM.InitArgv(argv);

	const elem = document.documentElement;
	VID.width = (elem.clientWidth <= 320) ? 320 : elem.clientWidth;
	VID.height = (elem.clientHeight <= 200) ? 200 : elem.clientHeight;

	Sys.scantokey = [];
	Sys.scantokey[8] = Key.k.backspace;
	Sys.scantokey[9] = Key.k.tab;
	Sys.scantokey[13] = Key.k.enter;
	Sys.scantokey[16] = Key.k.shift;
	Sys.scantokey[17] = Key.k.ctrl;
	Sys.scantokey[18] = Key.k.alt;
	Sys.scantokey[19] = Key.k.pause;
	Sys.scantokey[27] = Key.k.escape;
	Sys.scantokey[32] = Key.k.space;
	Sys.scantokey[33] = Sys.scantokey[105] = Key.k.pgup;
	Sys.scantokey[34] = Sys.scantokey[99] = Key.k.pgdn;
	Sys.scantokey[35] = Sys.scantokey[97] = Key.k.end;
	Sys.scantokey[36] = Sys.scantokey[103] = Key.k.home;
	Sys.scantokey[37] = Sys.scantokey[100] = Key.k.leftarrow;
	Sys.scantokey[38] = Sys.scantokey[104] = Key.k.uparrow;
	Sys.scantokey[39] = Sys.scantokey[102] = Key.k.rightarrow;
	Sys.scantokey[40] = Sys.scantokey[98] = Key.k.downarrow;
	Sys.scantokey[45] = Sys.scantokey[96] = Key.k.ins;
	Sys.scantokey[46] = Sys.scantokey[110] = Key.k.del;
	for (i = 48; i <= 57; ++i) {
		Sys.scantokey[i] = i; // 0-9
    }
	Sys.scantokey[59] = Sys.scantokey[186] = 59; // ;
	Sys.scantokey[61] = Sys.scantokey[187] = 61; // =
	for (i = 65; i <= 90; ++i) {
		Sys.scantokey[i] = i + 32; // a-z
    }
	Sys.scantokey[106] = 42; // *
	Sys.scantokey[107] = 43; // +
	Sys.scantokey[109] = Sys.scantokey[173] = Sys.scantokey[189] = 45; // -
	Sys.scantokey[111] = Sys.scantokey[191] = 47; // /
	for (i = 112; i <= 123; ++i) {
		Sys.scantokey[i] = i - 112 + Key.k.f1; // f1-f12
    }
	Sys.scantokey[188] = 44; // ,
	Sys.scantokey[190] = 46; // .
	Sys.scantokey[192] = 96; // `
	Sys.scantokey[219] = 91; // [
	Sys.scantokey[220] = 92; // backslash
	Sys.scantokey[221] = 93; // ]
	Sys.scantokey[222] = 39; // '

	Sys.oldtime = Date.now() * 0.001;

	Sys.Print('Host.Init\n');
	Host.Init();

	for (i = 0; i < Sys.events.length; ++i) {
		window[Sys.events[i]] = Sys[Sys.events[i]];
    }

    // Main loop, set to run at 60FPS
	Sys.frame = setInterval(Host.Frame, 1000.0 / 60.0);
};

Sys.onbeforeunload = function() {
	return 'Are you sure you want to quit?';
};

Sys.oncontextmenu = function(e) {
	e.preventDefault();
};

Sys.onfocus = function() {
	for (let i = 0; i < 256; ++i) {
		Key.Event(i);
		Key.down[i] = false;
	}
};

Sys.onkeydown = function(e) {
	let key = Sys.scantokey[e.keyCode];
	if (key == null) {
        return;
    }
	Key.Event(key, true);
	e.preventDefault();
};

Sys.onkeyup = function(e) {
	let key = Sys.scantokey[e.keyCode];
	if (key == null) {
        return;
    }
	Key.Event(key);
	e.preventDefault();
};

Sys.onmousedown = function(e) {
	let key;
	switch (e.which) {
	case 1:
		key = Key.k.mouse1;
		break;
	case 2:
		key = Key.k.mouse3;
		break;
	case 3:
		key = Key.k.mouse2;
		break;
	default:
		return;
	}
	Key.Event(key, true)
	e.preventDefault();
};

Sys.onmouseup = function(e) {
	let key;
	switch (e.which) {
	case 1:
		key = Key.k.mouse1;
		break;
	case 2:
		key = Key.k.mouse3;
		break;
	case 3:
		key = Key.k.mouse2;
		break;
	default:
		return;
	}
	Key.Event(key)
	e.preventDefault();
};

Sys.onmousewheel = function(e) {
	let key = e.wheelDeltaY > 0 ? Key.k.mwheelup : Key.k.mwheeldown;
	Key.Event(key, true);
	Key.Event(key);
	e.preventDefault();
};

Sys.onunload = function() {
	Host.Shutdown();
};

Sys.onwheel = function(e) {
	let key = e.deltaY < 0 ? Key.k.mwheelup : Key.k.mwheeldown;
	Key.Event(key, true);
	Key.Event(key);
	e.preventDefault();
};

Sys._onQuit = function() {
	if (Sys.frame != null) {
		clearInterval(Sys.frame);
	}

	for (let i = 0; i < Sys.events.length; ++i) {
		window[Sys.events[i]] = null;
    }

	if (Host.initialized === true) {
		Host.Shutdown();
    }

    document.body.style.cursor = 'auto';
}

Sys._hasConsole = function() {
    return window.console != null;
}