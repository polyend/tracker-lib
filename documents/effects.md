---
title: Effects reference
group: Documents
---

# Step Effects & Effects Reference

This page provides a reference for all available Step FX supported by the Polyend Tracker and this library.

In tracker patterns, each step can have up to two effect parameters (referred to as **FX0** and **FX1**).
These are represented in the {@link StepData} structure as an array of {@link FX} objects.

## Reference Table

Below is the complete list of effects defined in `types/patterns.ts:284`:

|  Index   | Symbol | Effect Name | Range (Internal) | Default | Scaled / Display Range | Description / Notes |
|:--------:| :---: | :--- | :---: | :---: | :---: | :--- |
|   `0`    | `-` | None | `0 - 100` | `0` | - | No effect applied. |
|   `1`    | `!` | Off | `0 - 0` | `0` | - | Turn off the note/instrument playback. |
|   `2`    | `m` | Micro-move | `0 - 100` | `0` | - | Nudges the step start time forwards. |
|   `3`    | `R` | Roll | `0 - 47` | `1` | - | Rolls/repeats the sample slice/note. |
|   `4`    | `C` | Chance | `0 - 100` | `0` | - | Probability percentage of step playing. |
|   `5`    | `n` | Random Note | `0 - 100` | `0` | - | Randomizes the note pitch. |
|   `6`    | `i` | Random Instrument | `0 - 100` | `0` | - | Randomly changes the active instrument. |
|   `7`    | `v` | Random Volume | `0 - 100` | `0` | - | Randomly varies step volume/velocity. |
|   `8`    | `a` | MIDI CC A | `0 - 127` | `0` | - | Sends MIDI Control Change CC A value. |
|   `9`    | `b` | MIDI CC B | `0 - 127` | `0` | - | Sends MIDI Control Change CC B value. |
|   `10`   | `c` | MIDI CC C | `0 - 127` | `0` | - | Sends MIDI Control Change CC C value. |
|   `11`   | `d` | MIDI CC D | `0 - 127` | `0` | - | Sends MIDI Control Change CC D value. |
|   `12`   | `e` | MIDI CC E | `0 - 127` | `0` | - | Sends MIDI Control Change CC E value. |
|   `13`   | `x` | Break Pattern | `1 - 1` | `1` | - | Jump/break immediately to next pattern. |
|   `14`   | `0` | MIDI Chord | `0 - 15` | `0` | - | Plays a preset chord shape over MIDI. |
|   `15`   | `T` | Tempo | `4 - 200` | `60` | `8 - 400` | Adjusts global playback tempo (BPM). |
|   `16`   | `x` | Random FX Value | `0 - 255` | `0` | - | Randomizes values of other effects. |
|   `17`   | `I` | Swing | `25 - 75` | `50` | `-25 to 25` | Adjusts swing percentage. |
|   `18`   | `V` | Volume/Velocity | `0 - 100` | `0` | - | Sets the playback volume or MIDI velocity. |
|   `19`   | `G` | Glide | `0 - 100` | `0` | - | Time to glide from previous note pitch. |
|   `20`   | `q` | Gate Length | `0 - 100` | `0` | - | Note gate duration override. |
|   `21`   | `A` | Arp | `0 - 33` | `0` | - | Configures arpeggiator mode/speed. |
|   `22`   | `p` | Position | `0 - 100` | `0` | - | Start position override within sample. |
|   `23`   | `g` | Volume LFO | `0 - 24` | `0` | - | Selects rate of volume modulation LFO. |
|   `24`   | `h` | Panning LFO | `0 - 30` | `0` | - | Selects rate of panning modulation LFO. |
|   `25`   | `S` | Slice | `0 - 47` | `0` | `1 - 48` | Trigger specific sample slice index. |
|   `26`   | `r` | Reverse Playback | `0 - 1` | `0` | - | Play sample backward (`1`) or forward (`0`). |
|   `27`   | `L` | Low-pass | `0 - 100` | `0` | - | Low-pass filter cutoff frequency. |
|   `28`   | `H` | High-pass | `0 - 100` | `0` | - | High-pass filter cutoff frequency. |
|   `29`   | `B` | Band-pass | `0 - 100` | `0` | - | Band-pass filter cutoff frequency. |
|   `30`   | `s` | Delay Send | `0 - 100` | `0` | - | Amount of signal sent to delay effect. |
|   `31`   | `P` | Panning | `0 - 100` | `0` | `-50 to 50` | Stereo panning placement (`0` = center). |
|   `32`   | `t` | Reverb Send | `0 - 100` | `0` | - | Amount of signal sent to reverb effect. |
|   `33`   | `l` | Finetune LFO | `0 - 30` | `0` | - | Selects rate of pitch finetune LFO. |
|   `34`   | `M` | Micro-tune/Pitchbend | `0 - 198` | `0` | `-99 to 99` | Small pitch offset adjustments. |
|   `35`   | `j` | Filter LFO | `0 - 30` | `0` | - | Selects rate of filter cutoff LFO. |
|   `36`   | `k` | Position LFO | `0 - 30` | `0` | - | Selects rate of sample position LFO. |
|   `37`   | `f` | MIDI CC F | `0 - 127` | `0` | - | Sends MIDI Control Change CC F value. |
|   `38`   | `D` | Overdrive | `0 - 100` | `0` | - | Distorts/overdrives the instrument output. |
|   `39`   | `E` | Bit Depth | `1 - 16` | `0` | - | Reduces output bit depth (lo-fi effect). |
|   `40`   | `U` | Tune | `0 - 48` | `0` | `-24 to 24` | Pitch tuning offset in semitones. |
|   `41`   | `F` | Slide Up | `0 - 255` | `0` | - | Smoothly glides the pitch upwards. |
|   `42`   | `J` | Slide Down | `0 - 255` | `0` | - | Smoothly glides the pitch downwards. |

---

## Working with FX programmatically

The library exports an array `PatternFX` with type {@link FXRecord}.
You can import and use it to search or inspect effects.

### Example: Searching for an effect by symbol
```typescript
import { PatternFX } from 'tracker-lib';

// Find the volume effect
const volumeFX = PatternFX.find(fx => fx.symbol === 'V');
if (volumeFX) {
  console.log(`Effect name: ${volumeFX.name}`); // Volume/Velocity
  console.log(`Min value: ${volumeFX.min}, Max value: ${volumeFX.max}`);
}
```

### Example: Setting step effects in a pattern
```typescript
import Tracker, { PatternFX } from 'tracker-lib';

// Create a new pattern with 16 tracks and 64 steps
const pattern = Tracker.createPattern(16, 64);

// Get a reference to step 0 on track 0
const step = pattern.tracks[0].steps[0];

// Assign Note C-5 (note value 60), Instrument index 0
step.note = 60;
step.instrument = 0;

// Set FX0: Volume (V) to 80%
step.fx[0] = {
  type: PatternFX.find(fx => fx.symbol === 'V') || PatternFX[0],
  value: 80
};

// Set FX1: Low-pass Filter Cutoff (L) to 50%
step.fx[1] = {
  type: PatternFX.find(fx => fx.symbol === 'L') || PatternFX[0],
  value: 50
};
```
