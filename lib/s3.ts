import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (s3Client) return s3Client;

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error("AWS credentials are not defined in environment variables");
    }

    s3Client = new S3Client({
        region: process.env.AWS_REGION || "ap-south-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    return s3Client;
}

function getBucketName(): string {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    if (!bucket) {
        throw new Error("AWS_S3_BUCKET_NAME is not defined in environment variables");
    }
    return bucket;
}

export async function uploadToS3(
    key: string,
    body: Buffer,
    contentType: string = "application/pdf"
): Promise<string> {
    await getS3Client().send(
        new PutObjectCommand({
            Bucket: getBucketName(),
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );
    return key;
}

/** Returns a time-limited URL to read the file (default: 1 hour) */
export async function getPresignedUrl(
    key: string,
    expiresInSeconds: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    });
    return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

export async function downloadFromS3(key: string): Promise<Buffer> {
    const response = await getS3Client().send(
        new GetObjectCommand({
            Bucket: getBucketName(),
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

export async function deleteFromS3(key: string): Promise<void> {
    await getS3Client().send(
        new DeleteObjectCommand({
            Bucket: getBucketName(),
            Key: key,
        })
    );
}
