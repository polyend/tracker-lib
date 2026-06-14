import JSZip from 'jszip';
import { readFile } from './file.js';
import type { FullProjectData, ProjectData } from '../types/project.js';
import type { InstrumentData } from '../types/instruments.js';
import type { PatternData, PatternsMetadata } from '../types/patterns.js';
import ProjectParser from '../projects/project.js';
import InstrumentParser from '../instruments/instrument.js';
import PatternParser from '../patterns/pattern.js';
import PatternsMetadataParser from '../patterns/metadata.js';

async function readZip(file: string | File): Promise<JSZip | null> {
  try {
    const data = await readFile(file);
    if (data === null) {
      return null;
    }
    let arrayBufferData: ArrayBuffer;
    if (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer) {
      arrayBufferData = new Uint8Array(data).slice().buffer;
    } else if (data instanceof ArrayBuffer) {
      arrayBufferData = data;
    } else {
      console.error('readZip received unexpected data type:', typeof data);
      return null;
    }
    const zip = new JSZip();
    return await zip.loadAsync(arrayBufferData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error loading zip file: ${message}`);
    throw err;
  }
}

async function loadProjectFromZip(file: string | File): Promise<FullProjectData | null> {
  const zip = await readZip(file);
  if (!zip) {
    return null;
  }

  let project: ProjectData | null = null;
  const instruments: InstrumentData[] = [];
  const patterns: PatternData[] = [];
  let patternsMetadata: PatternsMetadata | null = null;

  const projectFile = zip.file('project.mt');
  if (projectFile) {
    const projectContent = await projectFile.async('arraybuffer');
    project = ProjectParser.parse(projectContent);
  }

  const promises: Promise<void>[] = [];

  zip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
    if (zipEntry.dir) return;

    if (relativePath.startsWith('instruments/') && relativePath.endsWith('.pti')) {
      promises.push(
        (async () => {
          const instrumentContent = await zipEntry.async('arraybuffer');
          const instrument = InstrumentParser.parse(instrumentContent);
          if (instrument) {
            instruments.push(instrument);
          }
        })(),
      );
    } else if (relativePath.startsWith('patterns/') && relativePath.endsWith('.mtp')) {
      promises.push(
        (async () => {
          const patternContent = await zipEntry.async('arraybuffer');
          const pattern = PatternParser.parse(patternContent);
          if (pattern) {
            patterns.push(pattern);
          }
        })(),
      );
    } else if (relativePath === 'patterns/patternsMetadata') {
      promises.push(
        (async () => {
          const metadataContent = await zipEntry.async('arraybuffer');
          patternsMetadata = PatternsMetadataParser.parsePatternsMetadata(metadataContent);
        })(),
      );
    }
  });

  await Promise.all(promises);

  if (!project || !patternsMetadata) {
    console.error('Missing essential project files in zip: project.mt or patternsMetadata');
    return null;
  }

  return { project, instruments, patterns, patternsMetadata };
}

export { loadProjectFromZip };
