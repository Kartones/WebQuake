# Development Instructions

# Running the client

1. Install [http-server](https://www.npmjs.com/package/http-server)

2. From **to client root folder**:
- create `id1` subfolder
- copy `pak0.pak` to `id1\pak0.pak`
- copy `pak1.pak` to `id1\pak1.pak`
- copy `config.cfg` to `id1\config.cfg` *(optional)*
- copy `autoexec.cfg` to `id1\autoexec.cfg` *(optional)*

3. From client root folder, run:
```
http-server ./ -c-1
```

4. Go to `http://127.0.0.1:8080/index.htm?"-nocdaudio"`


# Code walkthrough

Based on [Fabien Sanglard's excellent Quake source code review](https://fabiensanglard.net/quakeSource/index.php).

[ASCII Table](https://kartones.net/demos/016/index.html): Useful for charCode conversions.

## Client

`\Client\WebQuake` folder.


#### `index.html`

Contains MS-DOS like screens, loads all JS and also contains some WebGL shaders

#### `Sys.js`

Entry point, contains `window.onload` function.

#### `GL.js`

Seems to contain GLQuake's client code (adapted to WebGL).

#### `Q.js`

Contains some helper functions to handle strings, int arrays, floats, etc. and conversions between them.