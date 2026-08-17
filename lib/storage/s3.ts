import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageService } from "./types";

export class S3StorageService implements StorageService {
    private client: S3Client | null = null;

    private getS3Client(): S3Client {
        if (this.client) return this.client;

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error("AWS credentials are not defined in environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
        }

        this.client = new S3Client({
            region: process.env.AWS_REGION || "ap-south-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        return this.client;
    }

    private getBucketName(): string {
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        if (!bucket) {
            throw new Error("AWS_S3_BUCKET_NAME is not defined in environment variables");
        }
        return bucket;
    }

    async uploadFile(key: string, body: Buffer, contentType: string = "application/pdf"): Promise<string> {
        await this.getS3Client().send(
            new PutObjectCommand({
                Bucket: this.getBucketName(),
                Key: key,
                Body: body,
                ContentType: contentType,
            })
        );
        return key;
    }

    async getFileUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.getBucketName(),
            Key: key,
        });
        return getSignedUrl(this.getS3Client(), command, { expiresIn: expiresInSeconds });
    }

    async downloadFile(key: string): Promise<Buffer> {
        const response = await this.getS3Client().send(
            new GetObjectCommand({
                Bucket: this.getBucketName(),
                Key: key,
            })
        );

        if (!response.Body) throw new Error(`No body returned for S3 key: ${key}`);

        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    async deleteFile(key: string): Promise<void> {
        await this.getS3Client().send(
            new DeleteObjectCommand({
                Bucket: this.getBucketName(),
                Key: key,
            })
        );
    }
}
