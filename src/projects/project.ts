import {
  type ProjectData,
  type ProjectHeader,
  type ProjectParsingState,
  type SongData,
  ProjectConstants,
  type MtValues,
  type ReverbParams,
} from '../types/project.js';
import { getTemplateBuffer } from '../data/project.js';

export default class Project {
  /**
   * Parses a '.mt' file from an ArrayBuffer.
   * @param {ArrayBuffer} buffer - The ArrayBuffer containing the project data.
   * @returns {ProjectData} The parsed project.
   */
  static parse(buffer: ArrayBuffer): ProjectData {
    const dataView = new DataView(buffer);
    const fileSize = buffer.byteLength;
    const state: ProjectParsingState = {
      offset: 0,
      project: {} as ProjectData,
    };

    this.readHeader(dataView, state);

    if (state.project.header.id_file !== ProjectConstants.FILE_IDENTIFIER) {
      throw new Error(
        `Invalid file signature: Expected '${ProjectConstants.FILE_IDENTIFIER}', got '${state.project.header.id_file}'.`,
      );
    }

    state.offset += ProjectConstants.PADDING_AFTER_HEADER;

    this.readSongData(dataView, state);

    // Read other data block (tempo, track names, project name, reverb/delay properties)
    this.readOtherData(dataView, state);

    // Assuming the CRC is at the very end of the file.
    // Calculate the remaining bytes for 'other data' before the CRC
    const otherDataLength = fileSize - state.offset - ProjectConstants.CRC_SIZE;
    state.offset += otherDataLength; // Skip any unparsed 'other data'

    this.readCrc(dataView, state);

    if (state.offset !== fileSize) {
      console.warn(`File parse incomplete: read ${state.offset} of ${fileSize} bytes.`);
    }

    return state.project;
  }

  static write(project: ProjectData): ArrayBuffer {
    const buffer = getTemplateBuffer();
    const dataView = new DataView(buffer);
    let offset = 0;

    offset = this.writeHeader(dataView, offset, project);
    offset += ProjectConstants.PADDING_AFTER_HEADER;
    offset = this.writeSongData(dataView, offset, project);

    // We assume fileStructureVersion >= 17 (always writing the latest version)
    this.writeOtherData(dataView, project);

    return buffer;
  }

  //----------------------------------
  // Private Methods
  //----------------------------------
  private static readHeader(dataView: DataView, state: ProjectParsingState): void {
    const idFileBytes = new Uint8Array(dataView.buffer, state.offset, 2);
    const id_file = new TextDecoder('ascii').decode(idFileBytes);
    state.offset += 2;

    const type_ = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const fwVersionBytes = new Uint8Array(dataView.buffer, state.offset, 4);
    const fwVersion_str = `${fwVersionBytes[0]}.${fwVersionBytes[1]}.${fwVersionBytes[2]}.${fwVersionBytes[3]}`;
    state.offset += 4;

    const fileStructureVersionBytes = new Uint8Array(dataView.buffer, state.offset, 4);
    const fileStructureVersion_str = `${fileStructureVersionBytes[0]}.${fileStructureVersionBytes[1]}.${fileStructureVersionBytes[2]}.${fileStructureVersionBytes[3]}`;
    state.offset += 4;

    const size = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.project.header = {
      id_file,
      type: type_,
      fwVersion: fwVersion_str,
      fileStructureVersion: fileStructureVersion_str,
      size,
    };
  }

  private static readSongData(dataView: DataView, state: ProjectParsingState): void {
    const playlist: number[] = [];
    for (let i = 0; i < ProjectConstants.PLAYLIST_SIZE; i++) {
      playlist.push(dataView.getUint8(state.offset++));
    }

    const playlistPos = dataView.getUint8(state.offset++);

    state.project.song = {
      playlist,
      playlistPos,
    };
  }

  private static readOtherData(dataView: DataView, state: ProjectParsingState): void {
    let globalTempo = 0;
    let projectName = '';
    const trackNames: string[] = [];
    let delayFeedback = 0;
    let delayTime = 0;
    let delayParams = 0;
    let delayVolume = 0;
    let delayMute = 0;
    let reverbVolume = 0;
    let reverbMute = 0;
    const reverb: ReverbParams = {
      size: 0,
      damp: 0,
      predelay: 0,
      diffusion: 0,
    };

    globalTempo = dataView.getFloat32(0x000001c0, true);

    const version: number = parseInt(state.project.header.fileStructureVersion.split('.')[0] || '0');
    let projectNameOffset: number = 0x00000600;
    let legacyProject = true;
    if (version > 16) {
      // Newest T+ / Mini file structure
      projectNameOffset = 0x00000810;
      legacyProject = false;
    } else if (version > 15) {
      // Older T+ / Mini file structure
      projectNameOffset = 0x0000080c;
      legacyProject = false;
    }

    const projectNameBytes = new Uint8Array(dataView.buffer, projectNameOffset, ProjectConstants.PROJECT_NAME_SIZE);
    projectName = new TextDecoder('ascii').decode(projectNameBytes).split('\x00')[0] || '';

    // Track Names
    let trackNameOffset = 0x00000428;
    for (let i = 0; i < 8; i++) {
      const nameBytes = new Uint8Array(dataView.buffer, trackNameOffset, ProjectConstants.TRACK_NAME_SIZE);
      const trackName = new TextDecoder('ascii').decode(nameBytes).split('\x00')[0] || '';
      trackNames.push(trackName);
      trackNameOffset += ProjectConstants.TRACK_NAME_SIZE;
    }

    // Next 8 track names (8 bytes each), if not a legacy / og tracker project
    if (!legacyProject) {
      let currentTrackNameOffset = 0x00000603;
      for (let i = 0; i < 8; i++) {
        const nameBytes = new Uint8Array(
          dataView.buffer,
          currentTrackNameOffset,
          ProjectConstants.TRACK_NAME_SIZE_SHORT,
        );
        const trackName = new TextDecoder('ascii').decode(nameBytes).split('\x00')[0] || '';
        trackNames.push(trackName);
        currentTrackNameOffset += ProjectConstants.TRACK_NAME_SIZE_SHORT;
      }
    }

    // Read delayFeedback (uint8_t)
    delayFeedback = dataView.getUint8(0x0000011a);

    // Read delayTime (uint16_t)
    delayTime = dataView.getUint16(0x0000011c, true);

    // Read delayParams (uint8_t)
    delayParams = dataView.getUint8(0x0000011f);

    // Read reverb.size (float)
    reverb.size = dataView.getFloat32(0x00000418, true);

    // Read reverb.damp (float)
    reverb.damp = dataView.getFloat32(0x0000041c, true);

    // Read reverb.predelay (float)
    reverb.predelay = dataView.getFloat32(0x00000420, true);

    // Read reverb.diffusion (float)
    reverb.diffusion = dataView.getFloat32(0x00000424, true);

    // Read reverbVolume (uint8_t)
    reverbVolume = dataView.getUint8(0x00000538);

    // Read delayVolume (uint8_t)
    delayVolume = dataView.getUint8(0x00000539);

    // Read reverbMute (uint8_t)
    reverbMute = dataView.getUint8(0x0000053a);

    // Read delayMute (uint8_t)
    delayMute = dataView.getUint8(0x0000053b);

    state.project.values = {
      globalTempo,
      trackNames,
      delayFeedback,
      delayTime,
      delayParams,
      delayVolume,
      delayMute,
      reverb,
      reverbVolume,
      reverbMute,
    };
    state.project.projectName = projectName;

    // The state.offset is not advanced by readOtherData as it uses absolute offsets.
    // It will be advanced by the main parse method after this function returns.
  }

  private static writeHeader(dataView: DataView, offset: number, project: ProjectData): number {
    const id_file = project.header.id_file;
    for (let i = 0; i < 2; i++) {
      dataView.setUint8(offset++, id_file.charCodeAt(i) || 0);
    }

    dataView.setUint16(offset, project.header.type, true);
    offset += 2;

    const fwVersionParts = project.header.fwVersion.split('.');
    for (let i = 0; i < 4; i++) {
      dataView.setUint8(offset++, parseInt(fwVersionParts[i] || '0', 10));
    }

    const fileStructureVersionParts = project.header.fileStructureVersion.split('.');
    for (let i = 0; i < 4; i++) {
      dataView.setUint8(offset++, parseInt(fileStructureVersionParts[i] || '0', 10));
    }

    dataView.setUint16(offset, project.header.size, true);
    offset += 2;

    return offset;
  }

  private static writeSongData(dataView: DataView, offset: number, project: ProjectData): number {
    for (let i = 0; i < ProjectConstants.PLAYLIST_SIZE; i++) {
      dataView.setUint8(offset++, project.song.playlist[i] || 0);
    }
    dataView.setUint8(offset++, project.song.playlistPos);
    return offset;
  }

  private static writeOtherData(dataView: DataView, project: ProjectData): void {
    dataView.setFloat32(0x000001c0, project.values.globalTempo, true);

    const projectNameOffset = 0x00000810;
    for (let i = 0; i < ProjectConstants.PROJECT_NAME_SIZE; i++) {
      dataView.setUint8(projectNameOffset + i, i < project.projectName.length ? project.projectName.charCodeAt(i) : 0);
    }

    let trackNameOffset = 0x00000428;
    for (let i = 0; i < 8; i++) {
      const trackName = project.values.trackNames[i] || '';
      for (let j = 0; j < ProjectConstants.TRACK_NAME_SIZE; j++) {
        dataView.setUint8(trackNameOffset + j, j < trackName.length ? trackName.charCodeAt(j) : 0);
      }
      trackNameOffset += ProjectConstants.TRACK_NAME_SIZE;
    }

    let currentTrackNameOffset = 0x00000603;
    for (let i = 8; i < 16; i++) {
      const trackName = project.values.trackNames[i] || '';
      for (let j = 0; j < ProjectConstants.TRACK_NAME_SIZE_SHORT; j++) {
        dataView.setUint8(currentTrackNameOffset + j, j < trackName.length ? trackName.charCodeAt(j) : 0);
      }
      currentTrackNameOffset += ProjectConstants.TRACK_NAME_SIZE_SHORT;
    }

    dataView.setUint8(0x0000011a, project.values.delayFeedback);
    dataView.setUint16(0x0000011c, project.values.delayTime, true);
    dataView.setUint8(0x0000011f, project.values.delayParams);

    dataView.setFloat32(0x00000418, project.values.reverb.size, true);
    dataView.setFloat32(0x0000041c, project.values.reverb.damp, true);
    dataView.setFloat32(0x00000420, project.values.reverb.predelay, true);
    dataView.setFloat32(0x00000424, project.values.reverb.diffusion, true);

    dataView.setUint8(0x00000538, project.values.reverbVolume);
    dataView.setUint8(0x00000539, project.values.delayVolume);
    dataView.setUint8(0x0000053a, project.values.reverbMute);
    dataView.setUint8(0x0000053b, project.values.delayMute);
  }

  private static readCrc(dataView: DataView, state: ProjectParsingState): void {
    const crc = dataView.getUint32(state.offset, true);
    state.project.crc = `0x${crc.toString(16).toUpperCase()}`;
    state.offset += ProjectConstants.CRC_SIZE;
  }
}
