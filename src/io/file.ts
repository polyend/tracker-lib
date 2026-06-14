async function readFile(file: string | File): Promise<ArrayBuffer | SharedArrayBuffer | null> {
  try {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      if (typeof file !== 'string') {
        console.error('File should be a string based filepath');
        return null;
      }

      const { readFile } = await import('fs/promises');
      const buffer: Buffer = await readFile(file);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }

    if (file instanceof File) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    }

    const response = await fetch(file);
    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error loading file: ${message}`);
    throw err;
  }
}

async function writeFile(data: ArrayBuffer, filePath: string): Promise<void> {
  try {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment
      const { writeFile: fsWriteFile } = await import('fs/promises');
      await fsWriteFile(filePath, Buffer.from(data));
    } else {
      // Browser environment
      const blob = new Blob([data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error writing file: ${message}`);
    throw err;
  }
}

export { readFile, writeFile };
