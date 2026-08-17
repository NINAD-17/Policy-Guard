import type { StorageService } from "./types";
import { S3StorageService } from "./s3";
import { CloudinaryStorageService } from "./cloudinary";

export * from "./types";
export { S3StorageService } from "./s3";
export { CloudinaryStorageService } from "./cloudinary";

let activeStorageService: StorageService | null = null;

/**
 * Returns the active StorageService provider instance based on STORAGE_PROVIDER env variable.
 * Options: "s3" (default) or "cloudinary"
 */
export function getStorageService(): StorageService {
    if (activeStorageService) return activeStorageService;

    const provider = (process.env.STORAGE_PROVIDER || "s3").toLowerCase().trim();

    switch (provider) {
        case "cloudinary":
            activeStorageService = new CloudinaryStorageService();
            break;
        case "s3":
        default:
            activeStorageService = new S3StorageService();
            break;
    }

    return activeStorageService;
}

/** Convenience helper: Upload file using active storage provider */
export async function uploadFile(key: string, body: Buffer, contentType?: string): Promise<string> {
    return getStorageService().uploadFile(key, body, contentType);
}

/** Convenience helper: Get presigned/authenticated URL using active storage provider */
export async function getFileUrl(key: string, expiresInSeconds?: number): Promise<string> {
    return getStorageService().getFileUrl(key, expiresInSeconds);
}

/** Convenience helper: Download file buffer using active storage provider */
export async function downloadFile(key: string): Promise<Buffer> {
    return getStorageService().downloadFile(key);
}

/** Convenience helper: Delete file using active storage provider */
export async function deleteFile(key: string): Promise<void> {
    return getStorageService().deleteFile(key);
}
