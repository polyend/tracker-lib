//---------------------------------------------------
//
//  Instrument
//
//---------------------------------------------------

/**
 * Base properties for Instrument Data.
 * @ignore
 * @internal
 */
export interface InstrumentDataProps {
  /**
   * Array of all the available automations.
   * - `[0]` = Volume
   * - `[1]` = Panning
   * - `[2]` = Cutoff
   * - `[3]` = Wavetable Position
   * - `[4]` = Granular Position
   * - `[5]` = Finetune
   */
  automations: Automation[];
  /**
   * Instrument bit depth.
   * Valid range: `4` - `16` (integer).
   */
  bitdepth: number;
  /**
   * @ignore
   * CRC checksum for the instrument.
   * Not actually used and purely here for completeness sake.
   */
  crc: string;
  /**
   * Filter cutoff.
   * Valid range: `0.0` - `1.0` (float).
   */
  cutoff: number;
  /**
   * Instrument delay send.
   * Valid range: `0.0` - `1.0` (float).
   */
  delaySend: number;
  /**
   * End point of sample (in frames).
   * Valid range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  endPoint: number;
  /**
   * Filter enabled flag.
   */
  filterEnabled: boolean;
  /**
   * Filter type.
   */
  filterType: InstrumentFilterType;
  /**
   * Instrument fine tuning (cents).
   * Valid range: `-100` - `100` (integer).
   */
  finetune: number;
  /**
   * Granular properties.
   */
  granular: Granular;
  /**
   * Instrument header.
   */
  header: InstrumentHeader;
  /**
   * Instrument active flag (unused)
   */
  isActive: boolean;
  /**
   * Loop point 1 (Start of Loop).
   * Valid range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  loopPoint1: number;
  /**
   * Loop point 2 (End of Loop).
   * Valid range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  loopPoint2: number;
  /**
   * Integer value for number of set slices.
   * Valid value range: `0` to `47` (integer).
   */
  numSlices: number;
  /**
   * Instrument overdrive.
   * Valid range: `0` - `100` (integer).
   */
  overdrive: number;
  /**
   * Instrument panning.
   * Valid range: `-1.0` - `1.0` (float).
   * `0.0` = center
   */
  panning: number;
  /**
   * Indicates the playmode for the instrument.
   */
  playmode: InstrumentPlayMode;
  /**
   * Filter resonance.
   * Valid range: `0.0` - `4.3` (float).
   */
  resonance: number;
  /**
   * Instrument reverb send.
   * Valid range: `0.0` - `1.0` (float).
   */
  reverbSend: number;
  /**
   * Sample data/properties.
   */
  sample: SampleBankSlot;
  /**
   * Integer value representing the last selected slice on the tracker.
   * Valid value range: `0` to `47` (integer).
   */
  selectedSlice: number;
  /**
   * Array of slice positions.
   * Always contains 48 values. Use `numSlices` to check which ones are actually used.
   * Valid value range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  slices: number[];
  /**
   * Start point of sample (in frames).
   * Valid range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  startPoint: number;
  /**
   * Instrument coarse tuning (semitones).
   * Valid range: `-24` - `24` (integer).
   */
  tune: number;
  /**
   * Instrument volume.
   * Valid range: `0.0` - `2.0` (float).
   * `0.0` = 0db.
   */
  volume: number;
  /**
   * ArrayBuffer containing a valid 16bit 44.1khz `WAV` file.
   */
  wav: ArrayBuffer;
  /**
   * Integer value representing current active window within a wavetable.
   */
  wavetableCurrentWindow: number;
}

/**
 * Represents all the instrument data.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createInstrument} instead.
 */
export interface InstrumentData extends InstrumentDataProps {
  /**
   * Returns the sample as a `Blob`. Mimetype is `audio/wav`.
   */
  getSampleAsBlob(): Blob;
  /**
   * Replace / update the sample
   * @param wav - a new `ArrayBuffer` containing the new sample
   */
  setSample(wav: ArrayBuffer): void;
}

/**
 * Various instrument file headers.
 * Can be ignored, as they will be auto-created for you.
 */
export interface InstrumentHeader {
  /**
   * File type identifier.
   * Example: `TI` for instrument.
   */
  id_file: string;
  /**
   * File type as a number.
   * Currently always: `1` (= instrument)
   */
  type: number;
  /**
   * Firmware version (as 4 bytes) used to create this file.
   * Example: `Major`.`Minor`.`Patch`.`Beta`.
   */
  fwVersion: string;
  /**
   * File structure version (as 4 bytes)
   */
  fileStructureVersion: string;
  /**
   * Size of the instrument data (bytes)
   */
  size: number;
}

/**
 * Sample related properties.
 */
export interface SampleBankSlot {
  /**
   * Sample type.
   * - `0` = Wavefile
   * - `1` = Wavetable
   */
  type: SampleType;
  /**
   * Sample filename (Max 32 bytes).
   */
  filename: string;
  /**
   * Sample length (16bit interger sample count)
   */
  length: number;
  /**
   * Wavetable related values
   */
  wavetable: {
    /**
     * Wavetable window size.
     * Possible values: `32`, `64`, `128`, `256`, `512`, `1024`, `2048`.
     * Other values may cause errors.
     */
    windowSize: number;
    /**
     * Integer value representing the wavetable window count.
     */
    windowCount: number;
  };
  /**
   * Indicating number of channels from audio file.
   * - `1` = Mono file
   * - `2` = Stereo file
   */
  channels: number;
}

/**
 * Automation properties.
 * Contains envelope and LFO data.
 */
export interface Automation {
  /**
   * Indicates if this automation is enabled or disabled.
   */
  enabled: boolean;
  /**
   * Indicates if this automation is an LFO.
   * If not, use the `Envelope` instead.
   */
  isLFO: boolean;
  /**
   * Envelope properties
   */
  envelope: Envelope;
  /**
   * LFO properties
   */
  lfo: LFO;
}
/**
 * Envelope Properties object
 */
export interface Envelope {
  /**
   * Envelope amount.
   * Valid range: `0.0` - `1.0` (float).
   */
  amount: number;
  /**
   * Envelope delay in milliseconds (integer)
   */
  delay: number;
  /**
   * Envelope attack in milliseconds (integer)
   */
  attack: number;
  /**
   * Envelope decay in milliseconds (integer)
   */
  decay: number;
  /**
   * Envelope sustain.
   * Valid range: `0.0` - `1.0` (float).
   */
  sustain: number;
  /**
   * Envelope release in milliseconds (integer)
   */
  release: number;
}

/**
 * LFO Properties object
 */
export interface LFO {
  /**
   * Shape of the LFO.
   * @see LFO_SHAPE
   */
  shape: LFO_SHAPE;
  /**
   * LFO Rate / Speed.
   * @see LFO_SPEED
   */
  speed: LFO_SPEED;
  /**
   * LFO value.
   * Valid range: `0.0` - `1.0` (integer).
   */
  amount: number;
}

export interface Granular {
  /**
   * Length of a grain.
   * Valid range: `44` - `44100` samples (integer).
   */
  grainLength: number;
  /**
   * Current grain position
   * Valid range: `0` to `65535` (maximum for unsigned 16-bit integer).
   */
  currentPosition: number;
  /**
   * Granular shape.
   * @see GranularShape;
   */
  shape: GranularShape;
  /**
   * Granular playback type
   * @see GranularType
   */
  type: GranularType;
}

/**
 * @private
 * Used  internally during parsing. Can be ignored.
 */
export interface InstrumentParsingState {
  offset: number;
  instrument: InstrumentData;
}

//----------------------------------
// Enumerators
//----------------------------------
/**
 * Sample types
 */
export enum SampleType {
  WaveFile = 0,
  Wavetable = 1,
}

/**
 * Playback modes
 */
export enum InstrumentPlayMode {
  OneShot = 0,
  ForwardLoop = 1,
  BackwardLoop = 2,
  PingpongLoop = 3,
  Slice = 4,
  BeatSlice = 5,
  Wavetable = 6,
  Granular = 7,
}

/**
 * Filter types
 */
export enum InstrumentFilterType {
  LowPass = 0,
  HighPass = 1,
  BandPass = 2,
}

/**
 * LFO Shapes
 */
export enum LFO_SHAPE {
  RevSaw = 0,
  Saw = 1,
  Triangle = 2,
  Square = 3,
  Random = 4,
}

/**
 * Any values with underscores can be intepreted as divided.
 *
 * For example: `S1_12` would mean 1/12.
 */
export enum LFO_SPEED {
  S128 = 0,
  S96 = 1,
  S64 = 2,
  S48 = 3,
  S32 = 4,
  S24 = 5,
  S16 = 6,
  S12 = 7,
  S8 = 8,
  S6 = 9,
  S4 = 10,
  S3 = 11,
  S2 = 12,
  S3_2 = 13,
  S1 = 14,
  S3_4 = 15,
  S1_2 = 16,
  S3_8 = 17,
  S1_3 = 18,
  S1_4 = 19,
  S3_16 = 20,
  S1_6 = 21,
  S1_8 = 22,
  S1_12 = 23,
  S1_16 = 24,
  S1_24 = 25,
  S1_32 = 26,
  S1_48 = 27,
  S1_64 = 28,
}

/**
 * Granular crossfade types
 */
export enum GranularShape {
  Square = 0,
  Triangle = 1,
  Gauss = 2,
}

/**
 * Granular playback types
 */
export enum GranularType {
  Forward = 0,
  Backward = 1,
  PingPong = 2,
}

//----------------------------------
// Constants
//----------------------------------
/** @private */
export const InstrumentConstants = {
  FILE_IDENTIFIER: 'TI',
  TYPE: 1,
  HEADER_SIZE: 16,
  PADDING_AFTER_HEADER: 2,
  SAMPLE_BANK_SLOT_SIZE: 41,
  INSTRUMENT_MAIN_FIELDS_SIZE: 374, // Excluding header and CRC
  CRC_SIZE: 4,
  TOTAL_FILE_SIZE: 394, // HEADER_SIZE + INSTRUMENT_MAIN_FIELDS_SIZE + CRC_SIZE
  ENVELOPE_COUNT: 6,
  ENVELOPE_SIZE: 20,
  LFO_COUNT: 6,
  LFO_SIZE: 8,
  SLICES_COUNT: 48,
  SLICES_SIZE: 96, // 48 * 2 bytes (uint16_t)
  GRANULAR_SIZE: 6,
};

/** @ignore */
export const MAX_16BIT = 65535;
/** @ignore */
export const SAMPLE_RATE = 44100;

/** @ignore */
export const VOLUME_LFO_RATES: number[] = [
  24, 16, 12, 8, 6, 4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.333333, 0.25, 0.1875, 0.166667, 0.125, 0.083333, 0.0625,
  0.041667, 0.03125, 0.020833, 0.015625,
];

/** @ignore */
export const DEFAULT_LFO_RATES: number[] = [
  128, 96, 64, 48, 32, 24, 16, 12, 8, 6, 4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.333333, 0.25, 0.1875, 0.166667, 0.125,
  0.083333, 0.0625, 0.041667, 0.03125, 0.020833, 0.015625,
];

/** @ignore */
export const AMP_LOG_VALUES: number[] = [
  0, 0.0630957344, 0.0704693069, 0.0744731974, 0.078704579, 0.0831763771, 0.0879022517, 0.0928966387, 0.0981747943,
  0.1037528416, 0.1096478196, 0.1158777356, 0.1224616199, 0.1294195841, 0.1367728826, 0.1445439771, 0.1527566058,
  0.1614358557, 0.1706082389, 0.1803017741, 0.1905460718, 0.201372425, 0.2128139046, 0.2249054606, 0.2376840287,
  0.2511886432, 0.2654605562, 0.2805433638, 0.296483139, 0.3133285724, 0.3311311215, 0.349945167, 0.3698281798,
  0.3908408958, 0.413047502, 0.4365158322, 0.4613175746, 0.4875284901, 0.5152286446, 0.5445026528, 0.5754399373,
  0.6081350013, 0.6426877173, 0.6792036326, 0.7177942913, 0.758577575, 0.8016780634, 0.8472274141, 0.8953647655,
  0.9462371614, 1, 1.0568175092, 1.1168632478, 1.1803206357, 1.2473835142, 1.3182567386, 1.3931568029, 1.4723125024,
  1.5559656316, 1.6443717232, 1.7378008287, 1.8365383433, 1.9408858776, 2.0511621788, 2.1677041048, 2.2908676528,
  2.4210290467, 2.5585858869, 2.7039583641, 2.8575905434, 3.0199517204, 3.1915378551, 3.3728730866, 3.5645113343,
  3.7670379898, 3.9810717055, 4.2072662838, 4.4463126747, 4.6989410861, 4.9659232145, 5.2480746025, 5.5462571296,
  5.8613816451, 6.1944107508, 6.5463617407, 6.9183097092, 7.3113908348, 7.726805851, 8.1658237136, 8.6297854777,
  9.1201083936, 9.6382902362, 10.1859138805, 10.7646521363, 11.3762728582, 12.0226443462, 12.7057410521, 13.4276496114,
  14.1905752169, 14.996848355, 15.8489319246,
];
