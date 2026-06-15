## Introduction

`tracker-lib` is a TypeScript-based library for reading, writing, and creating files compatible with the Polyend Tracker family of devices ([1](https://polyend.com/tracker/), [2](https://polyend.com/tracker-mini/), [3](https://polyend.com/tracker-plus/)).

It provides easy-to-use utilities for manipulating Instruments (`.pti`), Patterns (`.mtp`), and Projects (`.mt`) files.

This library was possible thanks to [Polyend's](https://polyend.com) effort to [document the Tracker's file format](https://github.com/polyend/TrackerFilesDocs).

## Features

- Works in both NodeJS (using file paths) and Browser environments (using `File` objects).
- Read, write and create instrument files from scratch, including handling WAV sample data, slicing, and automations.
- Read, write and create pattern files. Provides complete control over tracks, steps, notes, and FX.
- Read, write and create project files.
- Built with TypeScript, offering type definitions for all Tracker data structures.

## Installation

Simply install via npm:

```bash
npm install tracker-lib
```

## Quick Start

### Reading an Instrument

```typescript
import Tracker from 'tracker-lib';

async function loadInstrument() {
  // In NodeJS, provide the file path. In the browser, provide a File object.
  const instrument = await Tracker.readInstrument('./path/to/instrument.pti');
  console.log(instrument);
}
```

### Creating and Writing a Pattern

```typescript
import Tracker from 'tracker-lib';

// Create a new pattern with 8 tracks and 64 steps
const pattern = Tracker.createPattern(8, 64);

// Write the pattern to a file
await Tracker.writePattern(pattern, 'pattern_01.mtp');
```

## Where to go from here?

Explore the modules and API references to learn more about everything the library can do:

- **{@link Tracker}**: The main entry point for reading and writing files.
- **{@link AudioUtil}**: Utilities for handling WAV sample data and audio processing.
- **[Pattern FX & Effects Reference](./effects.md)**: A complete guide to the available step effects, ranges, and scaled display mappings.
- **Types & Interfaces**: Detailed definitions of Instruments, Patterns, and Project data structures.

## Examples

[Sandroid](https://github.com/sandroidmusic) has created two example projects to demonstrate how you could use this library:

* **[Instrument Editor](https://polyend.sandroid.xyz/instrumented/)** - A new browser based Tracker Instrument Editor.
  * Create / Edit / Save Tracker Instruments directly in the browser.
  * Preview instruments in real-time.
  * Create sliced instruments.
  * Record samples, edit and add instrument automation directly in the browser.
  * Supports any audio source your browser can get access to.
  * **Source available at:** [github.com/sandroidmusic/tracker-pti-editor](https://github.com/sandroidmusic/tracker-pti-editor). <br/><br/>   
* **[Pattern Editor](https://polyend.sandroid.xyz/patterned/)** - A browser based pattern editor.
  * Load, edit and save patterns in the familiar Tracker interface.
  * **Source available at:** [github.com/sandroidmusic/tracker-mtp-editor](https://github.com/sandroidmusic/tracker-mtp-editor).

We hope, these examples will spark some ideas of what you can build with `tracker-lib`.\
Please share any and all creative uses of the library with us, over at the [Polyend Backstage Forum](https://backstage.polyend.com).

## Limitations

* 🟢 {@link InstrumentData | Instruments} and {@link PatternData | Patterns} are fully supported.
* 🟡 {@link ProjectData | Projects} are supported but with some limitations.
* 🟡 Currently {@link ProjectData} does not expose all project-specific fields/values and some (like delay) are not fully implemented. These will be added in the future, once they are documented by Polyend.


## Support

If you have any questions or feedback, feel free to reach out on the [Polyend Backstage Forum](https://backstage.polyend.com).

## Credits

* [Sandroid](https://sandroid.music) (Sandro Ducceschi)
* The awesome team at [Polyend](https://polyend.com)

## License

```text
The MIT License (MIT)

Copyright (c) 2026 Polyend

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
