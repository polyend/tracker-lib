//---------------------------------------------------
//
//  Patterns Metadata
//
//---------------------------------------------------
/**
 * @internal
 * @ignore
 * Used during parsing. Can be ignored.
 */
export interface MetadataParsingState {
  offset: number;
  headerInfo: MetadataHeaderInfo;
  patternNames: string[];
}

/**
 * Represents the metadata for a collection of patterns.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createPatternsMetadata} instead.
 */
export interface PatternsMetadata {
  /**
   * Header Information
   */
  headerInfo: MetadataHeaderInfo;
  /**
   * The names of the patterns (if defined).
   * Each index corresponds to a pattern, starting from 0. Pattern name can be max. 30 characters long.
   */
  patternNames: string[];
}

/**
 * Represents the header information for a collection of patterns.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createPatternsMetadata} instead.
 */
export interface MetadataHeaderInfo {
  /**
   * File identifier. Currently always: `PAMD`
   */
  file_identifier: string;
  /**
   * Version number. Currently always `1`
   */
  version: number;
  /**
   * Total data size in bytes. No need to define as it is calculated automatically.
   */
  total_size: number;
  /**
   * Control flags (reserved, not used)
   */
  control_flags: number;
}

//----------------------------------
// Constants
//----------------------------------
/** @private */
export const PatternsMetaConstants = {
  FILE_IDENTIFIER: 'PAMD', // ASCII representation of b"PAMD"
  VERSION: 1,
  HEADER_SIZE: 16,
  PATTERN_RECORD_SIZE: 50, // Total size of each pattern record
};

//---------------------------------------------------
//
//  Pattern
//
//---------------------------------------------------
/**
 * @internal
 * @ignore
 * Used during parsing. Can be ignored.
 */
export interface PatternParsingState {
  offset: number;
  pattern: PatternData;
}

/**
 * Represents a pattern in a tracker project.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createPattern} instead.
 */
export interface PatternData {
  /**
   * Header information
   */
  header: PatternHeader;
  // unused: PatternUnusedFields;
  /**
   * Track data
   */
  tracks: TrackData[];
  /** @ignore */
  crc: number;
  /**
   * Number of tracks in the pattern.
   *
   * Should either be 12 (for OG Tracker) or 16 (for Tracker+ and Mini).
   */
  trackCount: number;
}

/**
 * Represents the header information for a pattern.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createPattern} instead.
 */
export interface PatternHeader {
  /**
   * File type identifier (not used)
   */
  id_file: string;
  /**
   * File type as a number. Currently always `2` (for pattern).
   */
  type: number;
  /**
   * Firmware version as 4 bytes: [major.minor.patch.beta]. Does not need to be accurate.
   */
  fwVersion: number[];
  /**
   * File structure version string.
   */
  fileStructureVersion: string;
  /**
   * Size of the file in bytes.
   */
  size: number;
}

/*
export interface PatternUnusedFields {
  f_unused1: number;
  f_unused2: number;
  unused1: number;
  unused2: number;
  unused3: number;
  unused4: number;
}
*/

/**
 * Represents the data structure for a track in a pattern.
 */
export interface TrackData {
  /**
   * Number of steps in the track.
   * Min: `1`, Max: `128`.
   */
  length: number;
  /**
   * All the step data for the track.
   */
  steps: StepData[];
}

/**
 * Represents the data structure for a single step in a track.
 */
export interface StepData {
  /**
   * * `note` has value `0 - 127`, but can have special values:
   *    * `-1` - step is empty
   *    * `-2` - Step is off, fade out
   *    * `-3` - Step is off, cut
   *    * `-4` - Step is off, (default)
   */
  note: number;
  /**
   * Instrument index.
   * * `0 - 47` = Sample based instruments,
   * * `48 - 63` = MIDI instruments
   * * `64 -66` = Synth engines
   */
  instrument: number;
  /**
   * Step FX parameters.
   *
   * ⚠️ Tracker only supports two FX per step.
   */
  fx: FX[];
}

/**
 * Represents an FX lane on a step.
 */
export interface FX {
  /**
   * The effect record
   */
  type: FXRecord;
  /**
   * The value of the effect
   */
  value: number;
}

/**
 * Represents a single FX record.
 *
 * See the Effects reference linked below for more information.
 * @document ../../documents/effects.md
 */
export interface FXRecord {
  /**
   * The default value of the effect.
   */
  default: number;
  /**
   * The index of the effect. This is what is actually stored in the pattern.
   */
  index: number;
  /**
   * The maximum value of the effect.
   */
  max: number;
  /**
   * The minimum value of the effect.
   */
  min: number;
  /**
   * The name of the effect.
   */
  name: string;
  /**
   * Some effects present a scaled min/max value to the user.
   * In this object you will find these values. Scale accordingly.
   */
  scaled?: {
    /**
     * The minimum value of the effect.
     */
    min: number;
    /**
     * The maximum value of the effect.
     */
    max: number;
  };
  /**
   * The symbol of the effect. Which is what is presented to the user.
   */
  symbol: string;
}

//----------------------------------
// Constants
//----------------------------------
/**
 * @ignore
 * @internal
 */
export const PatternConstants = {
  HEADER_SIZE: 14,
  PADDING_SIZE: 2,
  UNUSED_SIZE: 10,
  TRACK_COUNT_OLD: 8,
  TRACK_COUNT_OG: 12,
  TRACK_COUNT_MINI_PLUS: 16,
  STEP_COUNT: 128,
  STEP_SIZE: 6,
  TRACK_HEADER_SIZE: 1,
  CRC_SIZE: 4,
};

/*
export const NoteCommands: Record<string, string> = {
  '-1': 'Empty',
  '-2': 'Fade',
  '-3': 'Cut',
  '-4': 'Off',
};
*/

/**
 * @ignore
 * @internal
 */
export const PatternFX: FXRecord[] = [
  { index: 0, symbol: '-', name: 'None', min: 0, max: 100, default: 0 },
  { index: 1, symbol: '!', name: 'Off', min: 0, max: 0, default: 0 },
  { index: 2, symbol: 'm', name: 'Micro-move', min: 0, max: 100, default: 0 },
  { index: 3, symbol: 'R', name: 'Roll', min: 0, max: 47, default: 1 },
  { index: 4, symbol: 'C', name: 'Chance', min: 0, max: 100, default: 0 },
  { index: 5, symbol: 'n', name: 'Random Note', min: 0, max: 100, default: 0 },
  {
    index: 6,
    symbol: 'i',
    name: 'Random Instrument',
    min: 0,
    max: 100,
    default: 0,
  },
  {
    index: 7,
    symbol: 'v',
    name: 'Random Volume',
    min: 0,
    max: 100,
    default: 0,
  },
  { index: 8, symbol: 'a', name: 'MIDI CC A', min: 0, max: 127, default: 0 },
  { index: 9, symbol: 'b', name: 'MIDI CC B', min: 0, max: 127, default: 0 },
  { index: 10, symbol: 'c', name: 'MIDI CC C', min: 0, max: 127, default: 0 },
  { index: 11, symbol: 'd', name: 'MIDI CC D', min: 0, max: 127, default: 0 },
  { index: 12, symbol: 'e', name: 'MIDI CC E', min: 0, max: 127, default: 0 },
  { index: 13, symbol: 'x', name: 'Break Pattern', min: 1, max: 1, default: 1 },
  { index: 14, symbol: '0', name: 'MIDI Chord', min: 0, max: 15, default: 0 },
  {
    index: 15,
    symbol: 'T',
    name: 'Tempo',
    min: 4,
    max: 200,
    default: 60,
    scaled: { min: 8, max: 400 },
  },
  {
    index: 16,
    symbol: 'x',
    name: 'Random FX Value',
    min: 0,
    max: 255,
    default: 0,
  },
  {
    index: 17,
    symbol: 'I',
    name: 'Swing',
    min: 25,
    max: 75,
    default: 50,
    scaled: { min: -25, max: 25 },
  },
  {
    index: 18,
    symbol: 'V',
    name: 'Volume/Velocity',
    min: 0,
    max: 100,
    default: 0,
  },
  { index: 19, symbol: 'G', name: 'Glide', min: 0, max: 100, default: 0 },
  { index: 20, symbol: 'q', name: 'Gate Length', min: 0, max: 100, default: 0 },
  { index: 21, symbol: 'A', name: 'Arp', min: 0, max: 33, default: 0 },
  { index: 22, symbol: 'p', name: 'Position', min: 0, max: 100, default: 0 },
  { index: 23, symbol: 'g', name: 'Volume LFO', min: 0, max: 24, default: 0 },
  { index: 24, symbol: 'h', name: 'Panning LFO', min: 0, max: 30, default: 0 },
  {
    index: 25,
    symbol: 'S',
    name: 'Slice',
    min: 0,
    max: 47,
    default: 0,
    scaled: { min: 1, max: 48 },
  },
  {
    index: 26,
    symbol: 'r',
    name: 'Reverse Playback',
    min: 0,
    max: 1,
    default: 0,
  },
  { index: 27, symbol: 'L', name: 'Low-pass', min: 0, max: 100, default: 0 },
  { index: 28, symbol: 'H', name: 'High-pass', min: 0, max: 100, default: 0 },
  { index: 29, symbol: 'B', name: 'Band-pass', min: 0, max: 100, default: 0 },
  { index: 30, symbol: 's', name: 'Delay Send', min: 0, max: 100, default: 0 },
  {
    index: 31,
    symbol: 'P',
    name: 'Panning',
    min: 0,
    max: 100,
    default: 0,
    scaled: { min: -50, max: 50 },
  },
  { index: 32, symbol: 't', name: 'Reverb Send', min: 0, max: 100, default: 0 },
  { index: 33, symbol: 'l', name: 'Finetune LFO', min: 0, max: 30, default: 0 },
  {
    index: 34,
    symbol: 'M',
    name: 'Micro-tune/Pitchbend',
    min: 0,
    max: 198,
    default: 0,
    scaled: { min: -99, max: 99 },
  },
  { index: 35, symbol: 'j', name: 'Filter LFO', min: 0, max: 30, default: 0 },
  { index: 36, symbol: 'k', name: 'Position LFO', min: 0, max: 30, default: 0 },
  { index: 37, symbol: 'f', name: 'MIDI CC F', min: 0, max: 127, default: 0 },
  { index: 38, symbol: 'D', name: 'Overdrive', min: 0, max: 100, default: 0 },
  { index: 39, symbol: 'E', name: 'Bit Depth', min: 1, max: 16, default: 0 },
  {
    index: 40,
    symbol: 'U',
    name: 'Tune',
    min: 0,
    max: 48,
    default: 0,
    scaled: { min: -24, max: 24 },
  },
  { index: 41, symbol: 'F', name: 'Slide Up', min: 0, max: 255, default: 0 },
  { index: 42, symbol: 'J', name: 'Slide Down', min: 0, max: 255, default: 0 },
];
