# Polyend Tracker Library

`tracker-lib` is a TypeScript-based library for reading, writing, and creating files compatible with the Polyend Tracker family of devices ([1](https://polyend.com/tracker/), [2](https://polyend.com/tracker-mini/), [3](https://polyend.com/tracker-plus/)).

It provides easy-to-use utilities for manipulating Instruments (`.pti`), Patterns (`.mtp`), and Projects (`.mt`) files.

This library is based on the ongoing [documentation and Python scripts for the Tracker's file format](https://github.com/polyend/TrackerFilesDocs).

## Features

* Read, write, and modify Polyend Tracker Instrument (`.pti`) files (including raw WAV sample data, slice markers, playback modes, filters, LFOs, envelopes, and granular/wavetable configurations).
* Read and write pattern data, tracks, steps, and step-level FX/automation commands.
* Work with projects, songs, headers, and metadata constants compatible with Polyend Tracker hardware.
* Handle files via Node.js file paths or Browser `File` / `Blob` APIs seamlessly.
* Full TypeScript static typing, autocomplete, and auto-generated type definitions.

----

## Documentation

You can view the full docs and API reference here: https://polyend.github.io/tracker-lib/

----

## Examples

**[Instrument Editor](https://polyend.sandroid.xyz/instrumented/)** – A new browser-based Tracker Instrument Editor.
* Create / Edit / Save Tracker Instruments directly in the browser.
* Preview instruments in real-time.
* Create sliced instruments.
* Record samples, edit, and add instrument automation directly in the browser.
* Supports any audio source your browser can get access to.
* **Source available at:** [github.com/sandroidmusic/tracker-pti-editor](https://github.com/sandroidmusic/tracker-pti-editor). 

**[Pattern Editor](https://polyend.sandroid.xyz/patterned/)** – A browser-based pattern editor.
* Load, edit, and save patterns in the familiar Tracker interface.
* **Source available at:** [github.com/sandroidmusic/tracker-mtp-editor](https://github.com/sandroidmusic/tracker-mtp-editor).

We hope these examples will spark some ideas of what you can build with `tracker-lib`. 
Please share any and all creative uses of the library with us over at the [Polyend Backstage Forum](https://backstage.polyend.com).

----

## Quick start

### Working with Instruments (`.pti`)

#### Reading an Instrument
```typescript
import Tracker from 'tracker-lib';

// Node.js file path or Browser File object
const instrumentData = await Tracker.readInstrument('path/to/my-instrument.pti');
if (instrumentData) {
  console.log(`Loaded instrument: ${instrumentData.sample.filename}`);
  console.log(`Playback Mode: ${instrumentData.playmode}`);
  console.log(`Slices: ${instrumentData.numSlices}`);
}
```

#### Creating a New Instrument
```typescript
import Tracker from 'tracker-lib';

// Load a raw WAV file as an ArrayBuffer
const wavBuffer = await myFile.arrayBuffer();
// Create the instrument
const instrument = Tracker.createInstrument(wavBuffer);
// Save/serialize the instrument back to .pti format
await Tracker.writeInstrument(instrument, 'my-new-instrument.pti');
```

### File Utilities and Audio Properties

The library includes audio utilities to parse WAV files and extract channels, sample rates, bit depth, and frames:

```typescript
import { AudioUtil } from 'tracker-lib';

const wavInfo = AudioUtil.getWavInfo(wavBuffer);
console.log(`Channels: ${wavInfo.numChannels}, Length (Frames): ${wavInfo.numFrames}`);
```

----

## Development

### Available Scripts

* `npm run build`: Compiles TypeScript source files to the `dist/` directory.
* `npm run test`: Runs code formatting checks and type checking.
* `npm run format`: Formats code using Prettier.
* `npm run docs`: Generates API documentation via Typedoc.

## License

```text
The MIT License (MIT)

Copyright (c) 2026 Polyend

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
