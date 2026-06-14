import type { InstrumentData } from './instruments.js';
import type { PatternData, PatternsMetadata } from './patterns.js';

//---------------------------------------------------
//
//  Project
//
//---------------------------------------------------
/**
 * @internal
 * @ignore
 * Used during parsing. Can be ignored.
 */
export interface ProjectParsingState {
  offset: number;
  project: ProjectData;
}

/**
 * @internal
 * @ignore
 * Represent an entire projectg including instruments, patterns, and metadata.
 *
 * Currently not used/exposed
 */
export interface FullProjectData {
  instruments: InstrumentData[];
  patterns: PatternData[];
  patternsMetadata: PatternsMetadata;
  project: ProjectData;
}

/**
 * Represents the data structure for a project.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createProject} instead.
 */
export interface ProjectData {
  /**
   * @ignore
   * CRC checksum for the project.
   * Not actually used and purely here for completeness sake.
   */
  crc: string;
  /**
   * Metadata for the project.
   */
  header: ProjectHeader;
  /**
   * The name of the project. Max 32 characters.
   */
  projectName: string;
  /**
   * Contains song structure and last active pattern index.
   */
  song: SongData;
  /**
   * Represents various parameters / attributes within the project (Delay, Reverb, Tempo, Tracknames).
   */
  values: MtValues;
}

/**
 * Represents the header information of a project file.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createProject} instead.
 */
export interface ProjectHeader {
  /**
   * The identifier of the file, should always be `MT`.
   */
  id_file: string;
  /**
   * The type of the file. Should always be `1`, which stands for `Project`.
   */
  type: number;
  /**
   * The version of the firmware used in the project. Doesn't have to be accurate.
   */
  fwVersion: string;
  /**
   * The file structure version used in the project. For example: `17.17.17.17`.
   */
  fileStructureVersion: string;
  /**
   * The size of the file in bytes.
   */
  size: number;
}

/**
 * Represents the data structure for a song.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createProject} instead.
 */
export interface SongData {
  /**
   * An array of pattern indices representing the playlist. The array length is always `255`. Using a value of `0` means no pattern is assigned, to the chosen index/slot.
   */
  playlist: number[];
  /**
   * The index of the active pattern in the song.
   */
  playlistPos: number;
}

/**
 * Represents various parameters / attributes within the project.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createProject} instead.
 */
export interface MtValues {
  /**
   * The global tempo setting for the project, expressed in beats per minute (BPM).
   */
  globalTempo: number;
  /**
   * An array of track names. This has always a length of 16 values, even if only 12 may be supported (in the case of the OG Tracker).
   */
  trackNames: string[];
  /**
   * The feedback level of the delay effect.
   */
  delayFeedback: number;
  /**
   * The time interval of the delay effect, typically in milliseconds.
   */
  delayTime: number;
  /**
   * ⚠️ Currently not fully implemented / parsed.
   */
  delayParams: number;
  /**
   * The output volume level for the delay effect.
   */
  delayVolume: number;
  /**
   * Indicates whether the delay effect is muted (`1` for muted, `0` for unmuted).
   */
  delayMute: number;
  /**
   * The parameters for configuring the reverb effect.
   */
  reverb: ReverbParams;
  /**
   * The output volume level for the reverb effect.
   */
  reverbVolume: number;
  /**
   * Indicates whether the reverb effect is muted (`1` for muted, `0` for unmuted).
   */
  reverbMute: number;
}

/**
 * Represents  the parameters for configuring the reverb effect.
 *
 * ℹ️ There is no need to create this yourself. Use {@link Tracker.createProject} instead.
 */
export interface ReverbParams {
  /**
   * The size of the reverb effect.
   */
  size: number;
  /**
   * The damping level of the reverb effect.
   */
  damp: number;
  /**
   * The predelay time of the reverb effect, typically in milliseconds.
   */
  predelay: number;
  /**
   * The diffusion level of the reverb effect.
   */
  diffusion: number;
}

//----------------------------------
// Constants
//----------------------------------

/** @private */
export const ProjectConstants = {
  FILE_IDENTIFIER: 'MT',
  TYPE: 1,
  HEADER_SIZE: 16,
  PADDING_AFTER_HEADER: 2,
  SONG_DATA_SIZE: 256,
  PLAYLIST_SIZE: 255,
  PROJECT_NAME_SIZE: 32,
  INSTRUMENTS_COUNT: 48,
  PATTERN_INDEX_MAX: 255,
  TRACK_NAME_SIZE: 21,
  TRACK_NAME_SIZE_SHORT: 8,
  TRACK_COUNT: 16,
  CRC_SIZE: 4, // Assuming a 4-byte CRC at the end, similar to other files
};
