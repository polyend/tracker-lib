import {
  type PatternData,
  type PatternHeader,
  type PatternParsingState,
  type StepData,
  type TrackData,
  type FXRecord,
  PatternConstants,
  PatternFX,
} from '../types/patterns.js';

export default class Pattern {
  /**
   * Parses a '*.mtp' file from an ArrayBuffer.
   * @param {ArrayBuffer} buffer - The ArrayBuffer containing the pattern data.
   * @returns {PatternData} The parsed pattern.
   */
  static parse(buffer: ArrayBuffer): PatternData {
    const dataView = new DataView(buffer);
    const fileSize = buffer.byteLength;
    const trackCount = this.detectTrackCount(fileSize);
    const state: PatternParsingState = {
      offset: 0,
      pattern: {
        header: {} as PatternHeader,
        // unused: {} as PatternUnusedFields,
        tracks: [],
        crc: 0,
        trackCount,
      },
    };

    this.readHeader(dataView, state);

    if (state.pattern.header.id_file !== 'PM' && state.pattern.header.id_file !== 'KS') {
      throw new Error(`Invalid file signature: Expected 'PM', got '${state.pattern.header.id_file}'.`);
    }

    state.offset += PatternConstants.PADDING_SIZE;

    // Skip for now
    // this.readUnused(dataView, state);
    state.offset += 12;

    for (let i = 0; i < trackCount; i++) {
      state.pattern.tracks.push(this.readTrack(dataView, state));
    }

    this.readCrc(dataView, state);

    if (state.offset !== fileSize) {
      console.warn(`File parse incomplete: read ${state.offset} of ${fileSize} bytes.`);
    }

    return state.pattern;
  }

  /**
   * Writes a pattern to an ArrayBuffer.
   * @param {PatternData} pattern - The pattern data to write.
   * @returns {ArrayBuffer} The buffer containing the pattern data.
   */
  static write(pattern: PatternData): ArrayBuffer {
    const trackCount = pattern.tracks.length;
    const trackSize = PatternConstants.TRACK_HEADER_SIZE + PatternConstants.STEP_SIZE * PatternConstants.STEP_COUNT;
    const fileSize =
      PatternConstants.HEADER_SIZE +
      PatternConstants.PADDING_SIZE +
      12 +
      trackSize * trackCount +
      PatternConstants.CRC_SIZE;

    const buffer = new ArrayBuffer(fileSize);
    const dataView = new DataView(buffer);
    let offset = 0;

    offset = this.writeHeader(dataView, pattern.header, offset);

    offset += PatternConstants.PADDING_SIZE; // 2 bytes padding

    // Unused/reserved fields
    for (let i = 0; i < 12; i++) {
      dataView.setUint8(offset++, 0);
    }

    pattern.tracks.forEach((track) => {
      offset = this.writeTrack(dataView, track, offset);
    });

    this.writeCrc(dataView, pattern.crc, offset);

    return buffer;
  }

  //----------------------------------
  // Private Methods
  //----------------------------------
  private static detectTrackCount(fileSize: number): number {
    const Constants = PatternConstants;
    const base_size = Constants.HEADER_SIZE + Constants.PADDING_SIZE + Constants.UNUSED_SIZE;
    const track_size = Constants.TRACK_HEADER_SIZE + Constants.STEP_SIZE * Constants.STEP_COUNT;
    const total8 = base_size + track_size * Constants.TRACK_COUNT_OLD + Constants.CRC_SIZE;
    const total12 = base_size + track_size * Constants.TRACK_COUNT_OG + Constants.CRC_SIZE;
    const total16 = base_size + track_size * Constants.TRACK_COUNT_MINI_PLUS + Constants.CRC_SIZE;

    if (fileSize === total8) return Constants.TRACK_COUNT_OLD;
    if (fileSize === total12) return Constants.TRACK_COUNT_OG;
    if (fileSize === total16) return Constants.TRACK_COUNT_MINI_PLUS;

    return Constants.TRACK_COUNT_MINI_PLUS;
  }

  private static readHeader(dataView: DataView, state: PatternParsingState): void {
    const idFileBytes = new Uint8Array(dataView.buffer, state.offset, 2);
    const id_file = new TextDecoder('ascii').decode(idFileBytes);
    state.offset += 2;

    const type_ = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const fwVersionBytes = new Uint8Array(dataView.buffer, state.offset, 4);
    const fwVersionArr = Array.from(fwVersionBytes);
    state.offset += 4;

    const fileStructureVersionBytes = new Uint8Array(dataView.buffer, state.offset, 4);
    const fileStructureArr = Array.from(fileStructureVersionBytes);
    const fileStructureVersion_str = fileStructureArr.join('.');
    state.offset += 4;

    const size = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.pattern.header = {
      id_file,
      type: type_,
      fwVersion: fwVersionArr,
      fileStructureVersion: fileStructureVersion_str,
      size,
    };
  }

  /*
  private static readUnused(dataView: DataView, state: PatternParsingState): void {
    const f_unused1 = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    const f_unused2 = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    const unused1 = dataView.getUint8(state.offset++);
    const unused2 = dataView.getUint8(state.offset++);
    const unused3 = dataView.getUint8(state.offset++);
    const unused4 = dataView.getUint8(state.offset++);

    state.pattern.unused = { f_unused1, f_unused2, unused1, unused2, unused3, unused4 };

    if (f_unused1 !== 0 || f_unused2 !== 0 || unused1 !== 0 || unused2 !== 0 || unused3 !== 0 || unused4 !== 0) {
      console.warn(
        'Warning: Unused/reserved fields are not zero. This might indicate a corrupted file or an unexpected format.',
      );
    }
  }
  */

  private static readTrack(dataView: DataView, state: PatternParsingState): TrackData {
    const length = dataView.getUint8(state.offset++);
    const steps: StepData[] = [];
    for (let i = 0; i < PatternConstants.STEP_COUNT; i++) {
      steps.push(this.readStep(dataView, state));
    }
    return { length, steps };
  }

  private static readStep(dataView: DataView, state: PatternParsingState): StepData {
    const note = dataView.getInt8(state.offset++);
    const instrument = dataView.getUint8(state.offset++);
    const fx1_type = dataView.getUint8(state.offset++);
    let fx1_value = dataView.getUint8(state.offset++);
    const fx0_type = dataView.getUint8(state.offset++);
    let fx0_value = dataView.getUint8(state.offset++);

    if (fx1_type === 0) {
      fx1_value = 0;
    }
    if (fx0_type === 0) {
      fx0_value = 0;
    }
    return {
      note,
      instrument,
      fx: [
        { type: PatternFX[fx0_type] as FXRecord, value: fx0_value },
        { type: PatternFX[fx1_type] as FXRecord, value: fx1_value },
      ],
    };
  }

  private static readCrc(dataView: DataView, state: PatternParsingState): void {
    const crc = dataView.getUint32(state.offset, true);
    state.offset += PatternConstants.CRC_SIZE;
    state.pattern.crc = crc;
  }

  //----------------------------------
  // Private Write Methods
  //----------------------------------
  private static writeHeader(dataView: DataView, header: PatternHeader, offset: number): number {
    const encoder = new TextEncoder();
    const idFileBytes = encoder.encode(header.id_file.substring(0, 2));
    idFileBytes.forEach((byte) => dataView.setUint8(offset++, byte));

    dataView.setUint16(offset, header.type, true);
    offset += 2;

    for (let i = 0; i < 4; i++) {
      dataView.setUint8(offset++, header.fwVersion[i] || 0);
    }

    const fileStructureParts = header.fileStructureVersion.split('.');
    for (let i = 0; i < 4; i++) {
      dataView.setUint8(offset++, parseInt(fileStructureParts[i] || '0', 10));
    }

    dataView.setUint16(offset, header.size, true);
    offset += 2;

    return offset;
  }

  private static writeTrack(dataView: DataView, track: TrackData, offset: number): number {
    dataView.setUint8(offset++, track.length);
    for (let i = 0; i < PatternConstants.STEP_COUNT; i++) {
      if (i < track.steps.length) {
        offset = this.writeStep(dataView, track.steps[i]!, offset);
      } else {
        // Write empty step
        for (let j = 0; j < PatternConstants.STEP_SIZE; j++) {
          dataView.setUint8(offset++, 0);
        }
      }
    }
    return offset;
  }

  private static writeStep(dataView: DataView, step: StepData, offset: number): number {
    dataView.setInt8(offset++, step.note);
    dataView.setUint8(offset++, step.instrument);

    // FX1 is at index 1, FX0 is at index 0
    const fx1 = step.fx[1];
    const fx0 = step.fx[0];

    const fx1TypeIndex = fx1 && fx1.type ? fx1.type.index : 0;
    let fx1Value = fx1 ? fx1.value : 0;
    if (fx1TypeIndex === 0) {
      fx1Value = 0;
    }

    const fx0TypeIndex = fx0 && fx0.type ? fx0.type.index : 0;
    let fx0Value = fx0 ? fx0.value : 0;
    if (fx0TypeIndex === 0) {
      fx0Value = 0;
    }

    dataView.setUint8(offset++, fx1TypeIndex);
    dataView.setUint8(offset++, fx1Value);
    dataView.setUint8(offset++, fx0TypeIndex);
    dataView.setUint8(offset++, fx0Value);

    return offset;
  }

  private static writeCrc(dataView: DataView, crc: number, offset: number): number {
    dataView.setUint32(offset, crc || 0, true);
    offset += PatternConstants.CRC_SIZE;
    return offset;
  }
}
