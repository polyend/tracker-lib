import {
  type MetadataParsingState,
  type MetadataHeaderInfo,
  type PatternsMetadata,
  PatternsMetaConstants,
} from '../types/patterns.js';

export default class Metadata {
  /**
   * Parses a 'patternsMetadata' file from an ArrayBuffer.
   * @param {ArrayBuffer} buffer - The ArrayBuffer containing the metadata.
   * @returns {PatternsMetadata} The parsed metadata.
   */
  static parsePatternsMetadata(buffer: ArrayBuffer): PatternsMetadata {
    const dataView = new DataView(buffer);
    const fileSize = buffer.byteLength;
    const state: MetadataParsingState = {
      offset: 0,
      headerInfo: {} as MetadataHeaderInfo,
      patternNames: [],
    };

    this.readPatternsMetaHeader(dataView, state);
    this.readPatternRecords(dataView, state);

    if (state.offset !== fileSize) {
      console.warn(
        `Warning: Not all bytes were read. Expected to read ${fileSize} bytes, but finished at offset ${state.offset}.`,
      );
    }

    return {
      headerInfo: state.headerInfo,
      patternNames: state.patternNames,
    };
  }

  static writePatternsMetadata(metadata: PatternsMetadata): ArrayBuffer {
    const headerSize = PatternsMetaConstants.HEADER_SIZE;
    const recordSize = PatternsMetaConstants.PATTERN_RECORD_SIZE;
    const totalSize = headerSize + metadata.patternNames.length * recordSize;

    const buffer = new ArrayBuffer(totalSize);
    const dataView = new DataView(buffer);
    const uint8Array = new Uint8Array(buffer);
    const textEncoder = new TextEncoder();

    let offset = 0;

    for (let i = 0; i < 4; i++) {
      uint8Array[offset + i] = metadata.headerInfo.file_identifier.charCodeAt(i) || 0;
    }
    offset += 4;

    dataView.setUint16(offset, metadata.headerInfo.version, true);
    offset += 2;

    offset += 2;

    const sizeToWrite = metadata.headerInfo.total_size > 0 ? metadata.headerInfo.total_size : totalSize;
    dataView.setUint32(offset, sizeToWrite, true);
    offset += 4;

    dataView.setUint32(offset, metadata.headerInfo.control_flags, true);
    offset += 4;

    for (const patternName of metadata.patternNames) {
      const nameBytes = textEncoder.encode(patternName);
      const nameLength = Math.min(31, nameBytes.length);
      for (let i = 0; i < nameLength; i++) {
        // @ts-ignore
        uint8Array[offset + i] = nameBytes[i];
      }
      offset += recordSize;
    }
    return buffer;
  }

  //----------------------------------
  // Private Methods
  //----------------------------------
  private static readPatternsMetaHeader(dataView: DataView, state: MetadataParsingState): void {
    if (state.offset + PatternsMetaConstants.HEADER_SIZE > dataView.byteLength) {
      throw new Error('File too short for header. Data might be truncated.');
    }

    // file_id: 4 bytes, ASCII
    const fileIdBytes = new Uint8Array(dataView.buffer, state.offset, 4);
    const file_id = new TextDecoder('ascii').decode(fileIdBytes);
    state.offset += 4;

    // version: 2 bytes, unsigned short (UInt16)
    const version = dataView.getUint16(state.offset, true);
    state.offset += 2;

    // Skip 2 unused bytes
    state.offset += 2;

    // total_size: 4 bytes, unsigned int (UInt32)
    const total_size = dataView.getUint32(state.offset, true);
    state.offset += 4;

    // control_flags: 4 bytes, unsigned int (UInt32)
    const control_flags = dataView.getUint32(state.offset, true);
    state.offset += 4;

    // Validate file identifier
    if (file_id !== PatternsMetaConstants.FILE_IDENTIFIER) {
      throw new Error(`Invalid file identifier: Expected '${PatternsMetaConstants.FILE_IDENTIFIER}', got '${file_id}'`);
    }

    // Validate version
    if (version !== PatternsMetaConstants.VERSION) {
      throw new Error(`Unsupported version: Expected ${PatternsMetaConstants.VERSION}, got ${version}`);
    }

    state.headerInfo = {
      file_identifier: file_id,
      version: version,
      total_size: total_size,
      control_flags: control_flags,
    };
  }

  private static readPatternRecords(dataView: DataView, state: MetadataParsingState): void {
    state.patternNames = [];
    const textDecoder = new TextDecoder('ascii');

    while (state.offset + PatternsMetaConstants.PATTERN_RECORD_SIZE <= dataView.byteLength) {
      const recordBytes = new Uint8Array(dataView.buffer, state.offset, PatternsMetaConstants.PATTERN_RECORD_SIZE);
      // Extract pattern name (first 31 bytes, up to null terminator)
      // Find the null terminator (0x00)
      let nullTerminatorIndex = -1;
      const nameSliceLength = Math.min(31, recordBytes.length);
      for (let i = 0; i < nameSliceLength; i++) {
        if (recordBytes[i] === 0x00) {
          nullTerminatorIndex = i;
          break;
        }
      }

      let patternNameBytes: Uint8Array;
      if (nullTerminatorIndex !== -1) {
        // If null terminator found, decode up to that point
        patternNameBytes = recordBytes.subarray(0, nullTerminatorIndex);
      } else {
        // If no null terminator, decode the first 31 bytes as per Python logic
        patternNameBytes = recordBytes.subarray(0, nameSliceLength);
      }

      const pattern_name = textDecoder.decode(patternNameBytes);

      state.patternNames.push(pattern_name);

      /* Only add non-empty pattern names
      if (pattern_name.length > 0) {
        state.patternNames.push(pattern_name);
      }
      */

      state.offset += PatternsMetaConstants.PATTERN_RECORD_SIZE;
    }
  }
}
