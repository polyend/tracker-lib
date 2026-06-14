import { type InstrumentData, type InstrumentDataProps, MAX_16BIT } from '../types/instruments.js';

/**
 * Interface for WAV metadata information.
 */
export interface WavInfo {
  /**
   * Represents the number of channels (1 for mono, 2 for stereo)
   */
  numChannels: number;
  /**
   * Represents the number of bits per sample (8 for 8-bit audio, 16 for 16-bit audio)
   */
  bitsPerSample: number;
  /**
   * Represents the sample rate (number of samples per second)
   */
  sampleRate: number;
  /**
   * Represents the number of audio frames (samples) in the WAV file
   */
  numFrames: number;
}

/**
 * A Helper class for working with WAV files.
 */
export default class AudioUtil {
  /** @private */
  constructor() {}

  /**
   * Creates a WAV file from a Float32Array of audio data.
   *
   * @property {Float32Array} audioData - The audio data to be written to the WAV file.
   * @property {Object} options - Options for the WAV file.
   */
  static createWavFile(
    audioData: Float32Array,
    options: { numChannels: number; sampleRate: number; bitsPerSample: number },
  ): ArrayBuffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const bytesPerSample = bitsPerSample / 8;

    /*
    // Check if we can convert to mono
    if (numChannels === 2) {
      let isMono = true;
      const tolerance = 1e-6; // A small value for floating-point comparison

      // Compare left and right channels
      for (let i = 0; i < audioData.length / 2; i++) {
        const left = audioData[i * 2]!;
        const right = audioData[i * 2 + 1]!;
        if (Math.abs(left - right) > tolerance) {
          isMono = false;
          break;
        }
      }

      // If channels are identical, create a mono WAV file
      if (isMono) {
        const monoData = new Float32Array(audioData.length / 2);
        for (let i = 0; i < monoData.length; i++) {
          monoData[i] = audioData[i * 2]!; // Take the left channel data
        }
        return createWavFile(monoData, {
          numChannels: 1,
          sampleRate,
          bitsPerSample
        });
      }
    }
    */

    const blockAlign = numChannels * bytesPerSample;
    const dataLength = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // Write RIFF header
    AudioUtil.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); // ChunkSize
    AudioUtil.writeString(view, 8, 'WAVE');

    // Write fmt sub-chunk
    AudioUtil.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // Write data sub-chunk
    AudioUtil.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true); // Subchunk2Size

    // Write the actual audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i] as number));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Extracts and returns metadata information from a WAV file provided as an ArrayBuffer.
   *
   * @param {ArrayBuffer} wav The WAV file data as an ArrayBuffer.
   * @return {WavInfo} An object containing metadata information about the WAV file
   * @throws {Error} If the file is not a valid WAV file or required chunks are missing.
   */
  static getWavInfo(wav: ArrayBuffer): WavInfo {
    const dataView = new DataView(wav);

    const readString = (offset: number, length: number) => {
      const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, length);
      return new TextDecoder('ascii').decode(bytes);
    };

    // Check for 'RIFF' and 'WAVE'
    if (readString(0, 4) !== 'RIFF' || readString(8, 4) !== 'WAVE') {
      throw new Error("Invalid WAV file header: 'RIFF' and 'WAVE' identifiers not found.");
    }

    let offset = 12;
    let fmtChunk: { offset: number; size: number } | null = null;
    let dataChunk: { offset: number; size: number } | null = null;

    // Find 'fmt ' and 'data' chunks
    while (offset < dataView.byteLength) {
      const chunkId = readString(offset, 4);
      const chunkSize = dataView.getUint32(offset + 4, true);

      if (chunkId === 'fmt ') {
        fmtChunk = { offset: offset + 8, size: chunkSize };
      } else if (chunkId === 'data') {
        dataChunk = { offset: offset + 8, size: chunkSize };
      }

      offset += 8 + chunkSize;
      // Pad to even number of bytes
      if (chunkSize % 2 !== 0) {
        offset++;
      }

      // Optimization: stop if we've found both chunks
      if (fmtChunk && dataChunk) {
        break;
      }
    }

    if (!fmtChunk) {
      throw new Error("'fmt ' chunk not found in WAV file.");
    }
    if (!dataChunk) {
      throw new Error("'data' chunk not found in WAV file.");
    }

    // Parse fmt chunk
    const numChannels = dataView.getUint16(fmtChunk.offset + 2, true);
    const sampleRate = dataView.getUint32(fmtChunk.offset + 4, true);
    const bitsPerSample = dataView.getUint16(fmtChunk.offset + 14, true);

    // Calculate numFrames from data chunk
    const dataSize = dataChunk.size;
    const bytesPerSample = bitsPerSample / 8;
    const numFrames = Math.floor(dataSize / (numChannels * bytesPerSample));

    return {
      numChannels,
      bitsPerSample,
      sampleRate,
      numFrames,
    };
  }

  /** @ignore */
  static enrichInstrument(instrument: InstrumentDataProps): InstrumentData {
    const enriched = instrument as InstrumentData;

    enriched.getSampleAsBlob = function (): Blob {
      return new Blob([this.wav.slice(0)], { type: 'audio/wav' });
    };

    enriched.setSample = function (wav: ArrayBuffer): void {
      this.wav = wav;
      const { numChannels, numFrames } = AudioUtil.getWavInfo(wav);

      this.sample.length = numFrames;
      this.sample.channels = numChannels;

      this.startPoint = 0;
      this.loopPoint1 = 0;

      if (numFrames < MAX_16BIT) {
        this.endPoint = numFrames;
        this.loopPoint2 = numFrames;
      } else {
        this.endPoint = MAX_16BIT;
        this.loopPoint2 = MAX_16BIT;
      }

      /*
      this.numSlices = 0;
      if (this.slices) {
        this.slices.fill(0);
      }
      */
    };

    return enriched;
  }

  /** @ignore */
  static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
