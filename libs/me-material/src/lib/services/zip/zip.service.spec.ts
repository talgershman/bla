import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import JsZip from 'jszip';
import pako from 'pako';

import {MeZipService} from './zip.service';

function generateDummyFile(name: string, size: number): File {
  const file = new File([''], name);
  Object.defineProperty(file, 'size', {value: size});
  return file;
}

async function generateZipFile(fileName: string, fileContent: string): Promise<File> {
  const zip = new JsZip();
  zip.file(fileName, fileContent);
  const zipBlob = await zip.generateAsync({type: 'blob'});
  return new File([zipBlob], 'test.zip', {type: 'application/zip'});
}

async function generateGzipFile(fileName: string, fileContent: string) {
  const compressedData = pako.gzip(fileContent);
  const gzipBlob = new Blob([compressedData], {type: 'application/gzip'});
  return new File([gzipBlob], `${fileName}.gz`, {type: 'application/gzip'});
}

describe('MeZipService', () => {
  let spectator: SpectatorService<MeZipService>;
  const createService = createServiceFactory({
    service: MeZipService,
  });

  beforeEach((): void => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('tryGenerateZipFile', () => {
    it('should return File', (done) => {
      const file = generateDummyFile('dummy.txt', 7890);
      spectator.service.tryGenerateZipFile(file).subscribe((zip: File) => {
        expect(zip.name).toBe('dummy.txt');
        expect(zip.size).toBe(7890);
        done();
      });
    });

    it('should return smaller size', (done) => {
      const file = generateDummyFile('dummy.txt', 789000000);
      spectator.service.tryGenerateZipFile(file).subscribe((zip: File) => {
        expect(zip.name).toBe('dummy.zip');
        expect(zip.size).toBeLessThan(789000000);
        done();
      });
    });
  });

  describe('decompressFile', () => {
    it('should return the original file if not a ZIP', async () => {
      const file = generateDummyFile('dummy.txt', 1024);
      const result = await spectator.service.decompressFile(file);

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('dummy.txt');
      expect(result[0].size).toBe(1024);
    });

    it('should extract files from a ZIP archive', async () => {
      const zipFile = await generateZipFile('test.txt', 'Hello, world!');
      const extractedFiles = await spectator.service.decompressFile(zipFile);

      expect(extractedFiles.length).toBe(1);
      expect(extractedFiles[0].name).toBe('test.txt');
      expect(extractedFiles[0].size).toBeGreaterThan(0);
    });

    it('should handle gzip', async () => {
      const zipFile = await generateGzipFile('test.gz', 'Hello, world!');
      const extractedFiles = await spectator.service.decompressFile(zipFile);

      expect(extractedFiles.length).toBe(1);
      expect(extractedFiles[0].name).toBe('test.gz');
      expect(extractedFiles[0].size).toBeGreaterThan(0);
    });
  });
});
