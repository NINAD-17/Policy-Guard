import { v2 as cloudinary } from "cloudinary";
import type { StorageService } from "./types";

export class CloudinaryStorageService implements StorageService {
    private configured: boolean = false;

    private ensureConfigured(): void {
        if (this.configured) return;

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                "Cloudinary credentials are not defined in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
            );
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });

        this.configured = true;
    }

    async uploadFile(key: string, body: Buffer, _contentType: string = "application/pdf"): Promise<string> {
        this.ensureConfigured();

        // Sanitize key for Cloudinary public_id (remove leading slashes, keep folders)
        const publicId = key.replace(/^\/+/, "");

        return new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "raw",
                    public_id: publicId,
                    overwrite: true,
                    invalidate: true,
                },
                (error, result) => {
                    if (error || !result) {
                        return reject(
                            new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`)
                        );
                    }
                    resolve(result.public_id || publicId);
                }
            );

            uploadStream.end(body);
        });
    }

    async getFileUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
        this.ensureConfigured();

        const publicId = key.replace(/^\/+/, "");
        const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

        // Generate signed download URL for private raw resource (PDFs)
        try {
            const signedUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
                resource_type: "raw",
                expires_at: expiresAt,
                type: "upload",
            });
            return signedUrl;
        } catch {
            // Fallback: standard signed secure URL
            return cloudinary.url(publicId, {
                resource_type: "raw",
                secure: true,
                sign_url: true,
            });
        }
    }

    async downloadFile(key: string): Promise<Buffer> {
        this.ensureConfigured();

        // Generate URL to fetch file buffer
        const url = await this.getFileUrl(key, 600);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to download file from Cloudinary (status ${response.status}): ${key}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async deleteFile(key: string): Promise<void> {
        this.ensureConfigured();

        const publicId = key.replace(/^\/+/, "");
        await new Promise<void>((resolve, reject) => {
            cloudinary.uploader.destroy(
                publicId,
                { resource_type: "raw", invalidate: true },
                (error, _result) => {
                    if (error) {
                        return reject(
                            new Error(`Cloudinary delete failed: ${error.message}`)
                        );
                    }
                    resolve();
                }
            );
        });
    }
}
