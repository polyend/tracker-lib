//----------------------------------
// Imports
//----------------------------------
import {
  type Automation,
  GranularShape,
  GranularType,
  InstrumentConstants,
  type InstrumentData,
  type InstrumentDataProps,
  InstrumentFilterType,
  InstrumentPlayMode,
  LFO_SHAPE,
  LFO_SPEED,
  MAX_16BIT,
  SampleType,
} from './types/instruments.js';
import Instrument from './instruments/instrument.js';
import AudioUtil from './utils/audio.js';

import {
  type PatternData,
  PatternFX,
  type PatternHeader,
  PatternsMetaConstants,
  type PatternsMetadata,
  type StepData,
  type TrackData,
} from './types/patterns.js';
import Metadata from './patterns/metadata.js';
import Pattern from './patterns/pattern.js';

// import { type FullProjectData, type ProjectData } from './types/project.js';
import {
  type MtValues,
  ProjectConstants,
  type ProjectData,
  type ProjectHeader,
  type SongData,
} from './types/project.js';
import Project from './projects/project.js';

import { readFile, writeFile } from './io/file.js';
// import { loadProjectFromZip } from './io/project.js';

//----------------------------------
// Exports
//----------------------------------
export * from './types/patterns.js';
export * from './types/project.js';
export * from './types/instruments.js';
export { default as AudioUtil } from './utils/audio.js';
export type { WavInfo } from './utils/audio.js';

/**
 * Read and write Tracker Projects, Patterns and Instrument files.
 */
export default class Tracker {
  /** @private */
  constructor() {}

  /**
   * Reads and parses instrument data from a provided `.pti` file.
   *
   * @param {string | File} file - The file path or File object containing the `.pti` instrument data to be read.
   *
   * * **Browser based projects:** Pass a {@link File} object
   * * **NodeJS based projects:** Use a string based file path
   * @return {Promise<InstrumentData | null>} A promise that resolves to the parsed InstrumentData if successful, or null if the data cannot be read or parsed.
   */
  static async readInstrument(file: string | File): Promise<InstrumentData | null> {
    const buffer = await readFile(file);
    if (buffer instanceof ArrayBuffer) {
      return Instrument.parse(buffer);
    }
    return null;
  }

  /**
   * Writes the provided instrument data to a file in the specified format.
   *
   * @param {InstrumentData} instrument - The instrument data to be written to the file.
   * @param {string} [filename] - Optional filename to write the instrument data.
   * If not provided, the default filename will be derived from the instrument's sample filename with a `.pti` extension.
   * @return {Promise<void>} A promise that resolves when the file has been successfully written.
   */
  static async writeInstrument(instrument: InstrumentData, filename?: string): Promise<void> {
    const buffer = Instrument.write(instrument);
    if (buffer) {
      await writeFile(buffer, filename || `${instrument.sample.filename}.pti`);
    }
  }

  /**
   * Creates an instrument object with specified properties, including sample data, slices,
   * automation settings, and other configurations.
   *
   * @param {ArrayBuffer} [wavBuffer] An optional WAV file buffer containing the sample data for the instrument.
   * If not provided, a default empty buffer is used.
   * @param {number[]} [slices] An optional array of slice start positions for beat slicing mode.
   * If not provided, no slices are defined.
   * @return {InstrumentData} The constructed instrument object containing all the properties
   * needed for playback and processing.
   */
  static createInstrument(wavBuffer?: ArrayBuffer, slices?: number[]): InstrumentData {
    const automations: Automation[] = [];
    for (let i = 0; i < InstrumentConstants.ENVELOPE_COUNT; i++) {
      automations.push({
        enabled: i === 0,
        isLFO: false,
        envelope: {
          amount: 1,
          delay: 0,
          attack: 0,
          decay: 0,
          sustain: 1,
          release: 1000,
        },
        lfo: {
          shape: LFO_SHAPE.Triangle,
          speed: LFO_SPEED.S4,
          amount: 0,
        },
      });
    }

    const slicesArr = new Array(InstrumentConstants.SLICES_COUNT).fill(0);
    if (slices) {
      slices.forEach((pos, i) => {
        slicesArr[i] = pos;
      });
    }

    let sampleChannels = 1;
    let sampleLength = 0;

    if (wavBuffer) {
      const { numChannels, numFrames } = AudioUtil.getWavInfo(wavBuffer);
      sampleChannels = numChannels;
      sampleLength = numFrames;
    }

    const instrument: InstrumentDataProps = {
      header: {
        id_file: 'TI',
        type: 1,
        fwVersion: '1.9.1.1',
        fileStructureVersion: '9.9.9.9',
        size: 372,
      },
      isActive: true,
      sample: {
        type: SampleType.WaveFile,
        filename: 'untitled',
        length: sampleLength,
        wavetable: {
          windowSize: 256,
          windowCount: 0,
        },
        channels: sampleChannels,
      },
      playmode: slices ? InstrumentPlayMode.BeatSlice : InstrumentPlayMode.OneShot,
      startPoint: 0,
      loopPoint1: 0,
      loopPoint2: MAX_16BIT - 1,
      endPoint: MAX_16BIT,
      wavetableCurrentWindow: 0,
      automations,
      cutoff: 1.0,
      resonance: 0.0,
      filterType: InstrumentFilterType.LowPass,
      filterEnabled: false,
      tune: 0,
      finetune: 0,
      volume: 1.0,
      panning: 0.0,
      delaySend: 0.0,
      reverbSend: 0.0,
      slices: slicesArr,
      numSlices: slices ? slices.length : 0,
      selectedSlice: 0,
      granular: {
        grainLength: 4410,
        currentPosition: 0,
        shape: GranularShape.Triangle,
        type: GranularType.Forward,
      },
      overdrive: 0,
      bitdepth: 16,
      wav: wavBuffer ? wavBuffer : new ArrayBuffer(0),
      crc: '',
    };

    return AudioUtil.enrichInstrument(instrument);
  }

  /**
   * Reads a pattern from the specified file and parses it into a PatternData object.
   *
   * @param {string | File} file - The file to read the pattern data from. Can be a file path or a File object.
   * @return {Promise<PatternData | null>} A promise that resolves to a PatternData object if parsing is successful, or null if the input cannot be processed.
   */
  static async readPattern(file: string | File): Promise<PatternData | null> {
    const buffer = await readFile(file);
    if (buffer instanceof ArrayBuffer) {
      return Pattern.parse(buffer);
    }
    return null;
  }

  /**
   * Writes a given pattern to a file. The pattern data is serialized and saved
   * to the specified filename. If no filename is provided, a default name is used.
   *
   * @param {PatternData} pattern - The pattern data to be written to the file.
   * @param {string} [filename] - Optional. The name of the file to write to. Defaults to "pattern.mtp".
   * @return {Promise<void>} A promise that resolves when the file has been successfully written.
   */
  static async writePattern(pattern: PatternData, filename?: string): Promise<void> {
    const buffer = Pattern.write(pattern);
    if (buffer) {
      await writeFile(buffer, filename || `pattern.mtp`);
    }
  }

  /**
   * Creates a pattern structure with the specified number of tracks and steps.
   *
   * @param {number} numTracks - The number of tracks to include in the pattern. Should either be 12 (for OG Tracker) or 16 (for Tracker+ and Mini).
   * @param {number} numSteps - The number of steps per track in the pattern. Min: `1`, Max: `128`.
   * @return {PatternData} An object containing the pattern data, including header, tracks, and other metadata.
   */
  static createPattern(numTracks: number, numSteps: number): PatternData {
    const tracks: TrackData[] = [];
    for (let i = 0; i < numTracks; i++) {
      const steps: StepData[] = [];
      for (let j = 0; j < numSteps; j += 1) {
        steps.push({
          note: -1, // Empty note
          instrument: 0,
          fx: [
            { type: PatternFX[0]!, value: 0 }, // None
            { type: PatternFX[0]!, value: 0 }, // None
          ],
        });
      }
      tracks.push({
        length: numSteps - 1,
        steps: steps,
      });
    }

    const header: PatternHeader = {
      id_file: 'PM',
      type: 0,
      fwVersion: [1, 9, 0, 0],
      fileStructureVersion: '5.5.5.5',
      size: 0, // size is calculated on write
    };

    return {
      header,
      tracks,
      crc: 0,
      trackCount: numTracks,
    };
  }

  /**
   * Reads and parses the patterns metadata from the given file.
   *
   * @param {string | File} file - The file to read the patterns metadata from. Can be a file path or a File object.
   * @return {Promise<PatternsMetadata | null>} A promise that resolves to the parsed patterns metadata if successful, or null if the file content is invalid or cannot be processed.
   */
  static async readPatternsMetadata(file: string | File): Promise<PatternsMetadata | null> {
    const buffer = await readFile(file);
    if (buffer instanceof ArrayBuffer) {
      return Metadata.parsePatternsMetadata(buffer);
    }
    return null;
  }

  /**
   * Writes the given patterns metadata to the appropriate storage or file system.
   *
   * @param {PatternsMetadata} metadata - The metadata object containing patterns information to be written.
   * @return {Promise<void>} A promise that resolves when the metadata is successfully written.
   */
  static async writePatternsMetadata(metadata: PatternsMetadata) {
    const buffer = Metadata.writePatternsMetadata(metadata);
    if (buffer) {
      await writeFile(buffer, `patternsMetadata`);
    }
  }

  /**
   * Generates metadata for a set of patterns.
   *
   * @param {string[]} patternNames - An array of pattern names to include in the metadata.
   * @return {PatternsMetadata} The metadata object containing header information and the provided pattern names.
   */
  static createPatternsMetadata(patternNames: string[]): PatternsMetadata {
    return {
      headerInfo: {
        file_identifier: PatternsMetaConstants.FILE_IDENTIFIER,
        version: PatternsMetaConstants.VERSION,
        total_size: PatternsMetaConstants.HEADER_SIZE + patternNames.length * PatternsMetaConstants.PATTERN_RECORD_SIZE,
        control_flags: 0,
      },
      patternNames,
    };
  }

  /**
   * Reads and parses a project file into a ProjectData object.
   *
   * @param {string | File} file - The file path or File object to be read and parsed.
   * @return {Promise<ProjectData | null>} A promise that resolves to a ProjectData object if parsing is successful, or null if the input is not valid.
   */
  static async readProject(file: string | File): Promise<ProjectData | null> {
    const buffer = await readFile(file);
    if (buffer instanceof ArrayBuffer) {
      return Project.parse(buffer);
    }
    return null;
  }

  /**
   * Writes the provided project data to the appropriate storage or system.
   *
   * @param {ProjectData} project - The project data to be written.
   * @return {Promise<void>} A promise that resolves when the project data has been successfully written.
   */
  static async writeProject(project: ProjectData): Promise<void> {
    const buffer = Project.write(project);
    if (buffer) {
      await writeFile(buffer, `project.mt`);
    }
  }

  /**
   * Creates a new project with default configurations and the specified project name.
   *
   * @param {string} projectName - The name of the project to be created. Max 32 characters. Will be truncated if longer.
   * @return {ProjectData} The newly created project data object containing header information, project settings, and initial values.
   */
  static createProject(projectName: string): ProjectData {
    projectName = projectName.substring(0, ProjectConstants.PROJECT_NAME_SIZE);
    const header: ProjectHeader = {
      id_file: ProjectConstants.FILE_IDENTIFIER,
      type: ProjectConstants.TYPE,
      fwVersion: '1.9.2.255',
      fileStructureVersion: '17.17.17.17',
      size: 2324,
    };

    const playlist = new Array(ProjectConstants.PLAYLIST_SIZE).fill(0);
    playlist[0] = 1;
    const song: SongData = { playlist, playlistPos: 0 };

    const values: MtValues = {
      globalTempo: 130,
      trackNames: [
        'Track 1',
        'Track 2',
        'Track 3',
        'Track 4',
        'Track 5',
        'Track 6',
        'Track 7',
        'Track 8',
        'Midi 9',
        'Midi 10',
        'Midi 11',
        'Midi 12',
        'Midi 13',
        'Midi 14',
        'Midi 15',
        'Midi 16',
      ],
      delayFeedback: 50,
      delayTime: 500,
      delayParams: 0,
      delayVolume: 0,
      delayMute: 0,
      reverb: {
        size: 0.5,
        damp: 0.5,
        predelay: 0.5,
        diffusion: 0.68,
      },
      reverbVolume: 0,
      reverbMute: 0,
    };

    return {
      crc: '0x0',
      header,
      projectName,
      song,
      values,
    };
  }

  /*
  static async readProjectFromZip(file: string | File): Promise<FullProjectData | null> {
    return loadProjectFromZip(file);
  }
  */
}
