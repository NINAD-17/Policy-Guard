/**
 * Universal Storage Service Interface
 * Abstracts cloud file storage operations across providers (AWS S3, Cloudinary, etc.)
 */
export interface StorageService {
    /**
     * Upload a file buffer to cloud storage.
     * @param key Unique file identifier/path (e.g. "sops/1700000000-doc.pdf")
     * @param body File buffer
     * @param contentType MIME type (default: "application/pdf")
     * @returns The storage file key/identifier
     */
    uploadFile(key: string, body: Buffer, contentType?: string): Promise<string>;

    /**
     * Get a time-limited presigned/authenticated URL to view/read the file.
     * @param key Unique file identifier/path
     * @param expiresInSeconds Duration in seconds before URL expires (default: 3600)
     */
    getFileUrl(key: string, expiresInSeconds?: number): Promise<string>;

    /**
     * Download the file contents as a Buffer.
     * @param key Unique file identifier/path
     */
    downloadFile(key: string): Promise<Buffer>;

    /**
     * Delete the file from cloud storage.
     * @param key Unique file identifier/path
     */
    deleteFile(key: string): Promise<void>;
}
