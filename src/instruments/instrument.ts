import {
  type Automation,
  type Granular,
  type InstrumentData,
  type InstrumentParsingState,
  type LFO,
  type SampleBankSlot,
  GranularShape,
  GranularType,
  InstrumentConstants,
  InstrumentFilterType,
  InstrumentPlayMode,
  LFO_SHAPE,
  LFO_SPEED,
  SampleType,
} from '../types/instruments.js';
import AudioUtil from '../utils/audio.js';

type SourceEnvelope = {
  amount: number;
  delay: number;
  attack: number;
  hold: number;
  decay: number;
  sustain: number;
  release: number;
  loop: boolean;
  enabled: boolean;
};

export default class Instrument {
  /**
   * Parses a '*.pti' file from an ArrayBuffer.
   * @param {ArrayBuffer} buffer - The ArrayBuffer containing the instrument data.
   * @returns {InstrumentData} The parsed instrument.
   */
  static parse(buffer: ArrayBuffer): InstrumentData {
    const dataView = new DataView(buffer);
    const fileSize = buffer.byteLength;
    const state: InstrumentParsingState = {
      offset: 0,
      instrument: {} as InstrumentData,
    };

    this.readHeader(dataView, state);

    if (state.instrument.header.id_file !== InstrumentConstants.FILE_IDENTIFIER) {
      throw new Error(
        `Invalid file signature: Expected '${InstrumentConstants.FILE_IDENTIFIER}', got '${state.instrument.header.id_file}'.`,
      );
    }

    state.offset += InstrumentConstants.PADDING_AFTER_HEADER;

    this.readMainFields(dataView, state);

    // The remaining bytes after the main fields and before the CRC are the audio data
    const audioDataOffset = state.offset;
    const rawAudioDataLength = fileSize - InstrumentConstants.CRC_SIZE - audioDataOffset;
    const rawAudioData = buffer.slice(audioDataOffset, audioDataOffset + rawAudioDataLength);
    state.offset += rawAudioDataLength;

    // Create WAV Blob
    const sampleRate = 44100;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8; // 2 bytes for 16-bit

    // Determine channels based on rawAudioData byteLength and sampleLength from header
    const expectedMonoBytes = state.instrument.sample.length * bytesPerSample;
    const expectedStereoBytes = state.instrument.sample.length * bytesPerSample * 2;

    let numChannels;
    if (
      Math.abs(rawAudioData.byteLength - expectedStereoBytes) < Math.abs(rawAudioData.byteLength - expectedMonoBytes)
    ) {
      numChannels = 2; // stereo
    } else {
      numChannels = 1; // mono
    }
    state.instrument.sample.channels = numChannels;

    // Calculate actual sampleLength (frames) based on rawAudioData.byteLength and determined channels
    const bytesPerFrame = numChannels * bytesPerSample;
    const actualSampleLength = Math.floor(rawAudioData.byteLength / bytesPerFrame);

    // Interleave stereo data if necessary
    let finalAudioData = new Uint8Array(rawAudioData);
    if (numChannels === 2) {
      const interleavedBuffer = new Uint8Array(actualSampleLength * bytesPerFrame);
      const leftChannelOffset = 0;
      const rightChannelOffset = actualSampleLength * bytesPerSample;

      const rawAudioBytes = new Uint8Array(rawAudioData); // Convert to Uint8Array here

      for (let i = 0; i < actualSampleLength; i++) {
        // Copy left channel sample
        interleavedBuffer[i * bytesPerFrame] = rawAudioBytes[leftChannelOffset + i * bytesPerSample] as number;
        interleavedBuffer[i * bytesPerFrame + 1] = rawAudioBytes[leftChannelOffset + i * bytesPerSample + 1] as number;

        // Copy right channel sample
        interleavedBuffer[i * bytesPerFrame + 2] = rawAudioBytes[rightChannelOffset + i * bytesPerSample] as number;
        interleavedBuffer[i * bytesPerFrame + 3] = rawAudioBytes[rightChannelOffset + i * bytesPerSample + 1] as number;
      }
      finalAudioData = interleavedBuffer;
    }

    // Update the instrument's sample length to reflect the actual audio data length
    state.instrument.sample.length = actualSampleLength;

    // Convert 16-bit PCM (as Uint8Array) to Float32Array
    const pcmData = new Int16Array(finalAudioData.buffer, finalAudioData.byteOffset, finalAudioData.byteLength / 2);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = pcmData[i];
      if (sample) {
        floatData[i] = sample / 32768;
      }
    }

    state.instrument.wav = AudioUtil.createWavFile(floatData, {
      numChannels,
      sampleRate,
      bitsPerSample: bitDepth,
    });

    this.readCrc(dataView, state);

    /*
    if (state.offset !== fileSize) {
      console.warn(`File parse incomplete: read ${state.offset} of ${fileSize} bytes.`);
    }
    */

    return AudioUtil.enrichInstrument(state.instrument);
  }

  /**
   * Writes an instrument to a '*.pti' file ArrayBuffer.
   * @param {InstrumentData} instrument - The instrument to write.
   * @returns {ArrayBuffer} The buffer containing the instrument data.
   */
  static write(instrument: InstrumentData): ArrayBuffer {
    if (instrument.wav.detached) {
      throw new Error(
        "The instrument's wav ArrayBuffer is detached and cannot be used. Please provide a valid ArrayBuffer.",
      );
    }

    // Extract raw audio data from WAV
    const wavData = this.extractPcmDataFromWav(instrument.wav);
    let rawAudioData: Uint8Array;

    if (instrument.sample.channels === 2) {
      // De-interleave stereo data
      const bytesPerSample = 2; // 16-bit
      const leftChannel = new Uint8Array(instrument.sample.length * bytesPerSample);
      const rightChannel = new Uint8Array(instrument.sample.length * bytesPerSample);

      for (let i = 0; i < instrument.sample.length; i++) {
        const index = i * 2;
        const indexPlusOne = index + 1;
        // Left channel sample
        leftChannel[index] = wavData[i * 4] as number;
        leftChannel[indexPlusOne] = wavData[i * 4 + 1] as number;
        // Right channel sample
        rightChannel[index] = wavData[i * 4 + 2] as number;
        rightChannel[indexPlusOne] = wavData[i * 4 + 3] as number;
      }
      rawAudioData = new Uint8Array(leftChannel.byteLength + rightChannel.byteLength);
      rawAudioData.set(leftChannel, 0);
      rawAudioData.set(rightChannel, leftChannel.byteLength);
    } else {
      rawAudioData = wavData;
    }

    // Calculate buffer size. The audio data overwrites the CRC slot.
    const mainFieldsSize = 376;
    const bufferSize = InstrumentConstants.HEADER_SIZE + mainFieldsSize + rawAudioData.byteLength;

    const buffer = new ArrayBuffer(bufferSize);
    const dataView = new DataView(buffer);
    let offset = 0;

    // Write data
    offset = this.writeHeader(dataView, offset, instrument);
    offset = this.writeMainFields(dataView, offset, instrument);

    // Write audio data
    new Uint8Array(buffer).set(rawAudioData, offset);
    // offset += rawAudioData.byteLength;

    return buffer;
  }

  private static extractPcmDataFromWav(wavBuffer: ArrayBuffer): Uint8Array {
    const dataView = new DataView(wavBuffer);

    const readString = (offset: number, length: number) => {
      const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, length);
      return new TextDecoder('ascii').decode(bytes);
    };

    // Check for 'RIFF' and 'WAVE'
    if (readString(0, 4) !== 'RIFF' || readString(8, 4) !== 'WAVE') {
      throw new Error("Invalid WAV file header: 'RIFF' and 'WAVE' identifiers not found.");
    }

    // Find the 'data' chunk
    let offset = 12; // Start after 'WAVE'
    while (offset < dataView.byteLength) {
      const chunkId = readString(offset, 4);
      const chunkSize = dataView.getUint32(offset + 4, true); // little-endian

      if (chunkId === 'data') {
        const dataOffset = offset + 8;
        return new Uint8Array(wavBuffer, dataOffset, chunkSize);
      }

      // Move to the next chunk
      offset += 8 + chunkSize;

      // The chunk size should be padded to an even number of bytes.
      if (chunkSize % 2 !== 0) {
        offset++;
      }
    }

    throw new Error("'data' chunk not found in WAV file.");
  }

  //----------------------------------
  // Private Methods
  //----------------------------------

  private static writeHeader(dataView: DataView, offset: number, instrument: InstrumentData): number {
    this.writeString(dataView, offset, instrument.header.id_file);
    offset += 2;

    dataView.setUint16(offset, instrument.header.type, true);
    offset += 2;

    const fwVersionParts = instrument.header.fwVersion.split('.');
    for (let i = 0; i < 4; i++) {
      const part = fwVersionParts[i];
      let value = 0;
      if (part) {
        value = parseInt(part, 10) || 0;
      }
      dataView.setUint8(offset + i, value);
    }
    offset += 4;

    const fileStructureVersionParts = instrument.header.fileStructureVersion.split('.');
    for (let i = 0; i < 4; i++) {
      const part = fileStructureVersionParts[i];
      let value = 0;
      if (part) {
        value = parseInt(part, 10) || 0;
      }
      dataView.setUint8(offset + i, value);
    }
    offset += 4;

    dataView.setUint16(offset, instrument.header.size, true);
    offset += 2;

    // Add the missing 2 bytes of padding
    offset += 2;

    return offset;
  }

  private static writeMainFields(dataView: DataView, offset: number, instrument: InstrumentData): number {
    dataView.setUint8(offset++, instrument.isActive ? 1 : 0);
    offset += 3; // Skip 3 padding bytes

    offset = this.writeSampleBankSlot(dataView, offset, instrument.sample);

    offset += 4; // Skip reserved field

    dataView.setUint8(offset++, instrument.playmode);
    offset += 1; // Skip 1 padding byte

    dataView.setUint16(offset, instrument.startPoint, true);
    offset += 2;

    dataView.setUint16(offset, instrument.loopPoint1, true);
    offset += 2;

    dataView.setUint16(offset, instrument.loopPoint2, true);
    offset += 2;

    dataView.setUint16(offset, instrument.endPoint, true);
    offset += 2;

    offset += 2; // Skip 2 padding bytes

    dataView.setUint32(offset, instrument.wavetableCurrentWindow, true);
    offset += 4;

    instrument.automations.forEach((auto) => {
      offset = this.writeEnvelope(dataView, offset, auto);
    });

    instrument.automations.forEach((auto) => {
      offset = this.writeLFO(dataView, offset, auto.lfo);
    });

    dataView.setFloat32(offset, instrument.cutoff, true);
    offset += 4;

    dataView.setFloat32(offset, instrument.resonance * 4.3, true);
    offset += 4;

    dataView.setUint8(offset++, instrument.filterType);
    dataView.setUint8(offset++, instrument.filterEnabled ? 1 : 0);
    dataView.setInt8(offset++, instrument.tune);
    dataView.setInt8(offset++, instrument.finetune);

    dataView.setUint8(offset++, instrument.volume * 50);
    offset += 3;

    dataView.setInt16(offset, instrument.panning * 50 + 50, true);
    offset += 2;

    dataView.setUint8(offset, Math.round(instrument.delaySend * 100));
    offset += 2;

    for (let i = 0; i < InstrumentConstants.SLICES_COUNT; i++) {
      const slice = instrument.slices[i];
      let value = 0;
      if (slice !== undefined) {
        value = slice;
      }
      dataView.setUint16(offset, value, true);
      offset += 2;
    }

    dataView.setUint8(offset++, instrument.numSlices);
    dataView.setUint8(offset++, instrument.selectedSlice);

    offset = this.writeGranular(dataView, offset, instrument.granular);

    dataView.setUint8(offset++, Math.round(instrument.reverbSend * 100));
    dataView.setUint8(offset++, Math.round(instrument.overdrive * 100));
    dataView.setUint8(offset++, instrument.bitdepth);
    offset += 1; // Skip reserved

    // Add final 2 bytes of padding to match hardware output
    offset += 2;

    return offset;
  }

  private static writeSampleBankSlot(dataView: DataView, offset: number, sample: SampleBankSlot): number {
    dataView.setUint8(offset++, sample.type);

    const filenameBytes = new TextEncoder().encode(sample.filename || 'untitled');
    for (let i = 0; i < 32; i++) {
      const byte = (i < filenameBytes.length ? filenameBytes[i] : 0) as number;
      dataView.setUint8(offset + i, byte);
    }
    offset += 32;

    offset += 3; // Skip 3 padding bytes

    // Write the previously "reserved" field with the value from the hardware file
    dataView.setUint8(offset++, 0x00);
    dataView.setUint8(offset++, 0xa0);
    dataView.setUint8(offset++, 0x26);
    dataView.setUint8(offset++, 0x80);

    dataView.setUint32(offset, sample.length, true);
    offset += 4;

    // Write the correct wavetable window size from the hardware file
    dataView.setUint16(offset, 2048, true);
    offset += 2;

    offset += 2; // Skip 2 padding bytes

    dataView.setUint32(offset, sample.wavetable.windowCount, true);
    offset += 4;

    return offset;
  }

  private static writeEnvelope(dataView: DataView, offset: number, automation: Automation): number {
    dataView.setFloat32(offset, automation.envelope.amount, true);
    offset += 4;

    dataView.setUint16(offset, automation.envelope.delay, true);
    offset += 2;

    dataView.setUint16(offset, automation.envelope.attack, true);
    offset += 2;

    dataView.setUint16(offset, 0, true);
    offset += 2;

    dataView.setUint16(offset, automation.envelope.decay, true);
    offset += 2;

    dataView.setFloat32(offset, automation.envelope.sustain, true);
    offset += 4;

    dataView.setUint16(offset, automation.envelope.release, true);
    offset += 2;

    dataView.setUint8(offset++, automation.isLFO ? 1 : 0);
    dataView.setUint8(offset++, automation.enabled ? 1 : 0);

    return offset;
  }

  private static writeLFO(dataView: DataView, offset: number, lfo: LFO): number {
    dataView.setUint8(offset++, lfo.shape);
    dataView.setUint8(offset++, lfo.speed);
    offset += 2; // Skip 2 padding bytes

    dataView.setFloat32(offset, lfo.amount, true);
    offset += 4;

    return offset;
  }

  private static writeGranular(dataView: DataView, offset: number, granular: Granular): number {
    dataView.setUint16(offset, granular.grainLength, true);
    offset += 2;

    dataView.setUint16(offset, granular.currentPosition, true);
    offset += 2;

    dataView.setUint8(offset++, granular.shape);
    dataView.setUint8(offset++, granular.type);

    return offset;
  }

  //----------------------------------
  // Private Methods
  //----------------------------------
  private static writeString(view: DataView, offset: number, s: string): void {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  }

  private static readHeader(dataView: DataView, state: InstrumentParsingState): void {
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

    state.instrument.header = {
      id_file,
      type: type_,
      fwVersion: fwVersion_str,
      fileStructureVersion: fileStructureVersion_str,
      size,
    };
  }

  private static readMainFields(dataView: DataView, state: InstrumentParsingState): void {
    state.instrument.isActive = dataView.getUint8(state.offset++) === 1;
    state.offset += 3; // Skip 3 padding bytes

    state.instrument.sample = this.readSampleBankSlot(dataView, state);

    state.offset += 4; // Skip reserved field

    state.instrument.playmode = dataView.getUint8(state.offset++) as InstrumentPlayMode;
    state.offset += 1; // Skip 1 padding byte as per Python script

    state.instrument.startPoint = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.instrument.loopPoint1 = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.instrument.loopPoint2 = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.instrument.endPoint = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.offset += 2; // Skip 2 padding bytes

    state.instrument.wavetableCurrentWindow = dataView.getUint32(state.offset, true);
    state.offset += 4;

    const envelopes: SourceEnvelope[] = [];
    for (let i = 0; i < InstrumentConstants.ENVELOPE_COUNT; i++) {
      envelopes.push(this.readEnvelope(dataView, state));
    }

    const lfos: LFO[] = [];
    for (let i = 0; i < InstrumentConstants.LFO_COUNT; i++) {
      lfos.push(this.readLFO(dataView, state));
    }

    state.instrument.automations = envelopes.map((envelope, idx) => {
      const lfo: LFO = lfos[idx]!;
      return {
        enabled: envelope.enabled,
        isLFO: envelope.loop,
        envelope: {
          delay: envelope.delay,
          attack: envelope.attack,
          decay: envelope.decay,
          sustain: envelope.sustain,
          release: envelope.release,
          amount: envelope.amount,
        },
        lfo,
      };
    });

    state.instrument.cutoff = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    const resonance = dataView.getFloat32(state.offset, true);
    // max resonance can be 4.3 apparently
    state.instrument.resonance = resonance / 4.3;
    state.offset += 4;

    state.instrument.filterType = dataView.getUint8(state.offset++) as InstrumentFilterType;
    state.instrument.filterEnabled = dataView.getUint8(state.offset++) === 1;
    state.instrument.tune = dataView.getInt8(state.offset++);
    state.instrument.finetune = dataView.getInt8(state.offset++);

    const volume = dataView.getUint8(state.offset++);
    state.instrument.volume = Math.max(0, Math.min(100, volume)) / 50;

    state.offset += 3;

    const panning = dataView.getInt16(state.offset, true);
    state.instrument.panning = (Math.max(0, Math.min(100, panning)) - 50) / 50;
    state.offset += 2;

    const delaySend = dataView.getUint8(state.offset);
    state.instrument.delaySend = delaySend / 100;
    state.offset += 2;

    state.instrument.slices = [];
    for (let i = 0; i < InstrumentConstants.SLICES_COUNT; i++) {
      state.instrument.slices.push(dataView.getUint16(state.offset, true));
      state.offset += 2;
    }

    state.instrument.numSlices = dataView.getUint8(state.offset++);
    state.instrument.selectedSlice = dataView.getUint8(state.offset++);

    state.instrument.granular = this.readGranular(dataView, state);

    const reverbSend = dataView.getUint8(state.offset++);
    state.instrument.reverbSend = reverbSend / 100;

    const overdrive = dataView.getUint8(state.offset++);
    state.instrument.overdrive = overdrive / 100;

    state.instrument.bitdepth = dataView.getUint8(state.offset++);
    state.offset += 1; // Skip reserved
  }

  private static readSampleBankSlot(dataView: DataView, state: InstrumentParsingState): SampleBankSlot {
    const type = dataView.getUint8(state.offset++) as SampleType;

    const fileNameBytes = new Uint8Array(dataView.buffer, state.offset, 32);
    const filename = new TextDecoder('ascii').decode(fileNameBytes).split('\x00')[0] || '';
    state.offset += 32;

    state.offset += 3; // Skip 3 padding bytes
    state.offset += 4; // Skip reserved

    const length = dataView.getUint32(state.offset, true);
    state.offset += 4;

    const windowSize = dataView.getUint16(state.offset, true);
    state.offset += 2;

    state.offset += 2; // Skip 2 padding bytes

    const windowCount = dataView.getUint32(state.offset, true);
    state.offset += 4;

    return {
      type,
      filename,
      length,
      wavetable: {
        windowSize,
        windowCount,
      },
      channels: 0,
    };
  }

  private static readEnvelope(dataView: DataView, state: InstrumentParsingState): SourceEnvelope {
    const amount = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    const delay = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const attack = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const hold = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const decay = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const sustain = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    const release = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const loop = dataView.getUint8(state.offset++) === 1;
    const enabled = dataView.getUint8(state.offset++) === 1;

    return {
      amount,
      delay,
      attack,
      hold,
      decay,
      sustain,
      release,
      loop,
      enabled,
    };
  }

  private static readLFO(dataView: DataView, state: InstrumentParsingState): LFO {
    const shape = dataView.getUint8(state.offset++) as LFO_SHAPE;
    const speed = dataView.getUint8(state.offset++) as LFO_SPEED;
    state.offset += 2; // Skip 2 padding bytes

    const amount = dataView.getFloat32(state.offset, true);
    state.offset += 4;

    return {
      shape,
      speed,
      amount,
    };
  }

  private static readGranular(dataView: DataView, state: InstrumentParsingState): Granular {
    const grainLength = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const currentPosition = dataView.getUint16(state.offset, true);
    state.offset += 2;

    const shape = dataView.getUint8(state.offset++) as GranularShape;
    const type = dataView.getUint8(state.offset++) as GranularType;

    return {
      grainLength,
      currentPosition,
      shape,
      type,
    };
  }

  private static readCrc(dataView: DataView, state: InstrumentParsingState): void {
    const crc = dataView.getUint32(state.offset, true);
    state.instrument.crc = `0x${crc.toString(16).toUpperCase()}`;
    state.offset += InstrumentConstants.CRC_SIZE;
  }
}
