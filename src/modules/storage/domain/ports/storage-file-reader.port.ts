export abstract class StorageFileReaderPort {
  abstract readFileAsBase64(filePath: string): Promise<string | null>;
  abstract readFileBuffer(
    filePath: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null>;
}
