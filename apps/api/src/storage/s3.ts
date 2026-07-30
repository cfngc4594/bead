import {
  GetObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { s3Env } from "../s3-env.js";

const s3 = new S3Client({
  endpoint: s3Env.S3_ENDPOINT,
  region: s3Env.S3_REGION,
  credentials: {
    accessKeyId: s3Env.S3_ACCESS_KEY_ID,
    secretAccessKey: s3Env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType?: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: s3Env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObject(key: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: s3Env.S3_BUCKET,
      Key: key,
    }),
  );

  const body = await response.Body?.transformToByteArray();
  if (!body) {
    throw new Error(`Empty object body: ${key}`);
  }

  return body;
}

export async function getOptionalObject(key: string) {
  try {
    return await getObject(key);
  } catch (error) {
    if (error instanceof NoSuchKey || error instanceof NotFound) {
      return null;
    }
    throw error;
  }
}
