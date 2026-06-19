import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

let client: S3Client | null = null

function getObsConfig() {
  const config = useRuntimeConfig()
  return {
    accessKeyId: config.obsAccessKeyId as string,
    secretAccessKey: config.obsSecretAccessKey as string,
    bucket: config.obsBucket as string,
    region: config.obsRegion as string,
    endpoint: config.obsEndpoint as string,
    publicBaseUrl: (config.obsPublicBaseUrl as string).replace(/\/$/, ''),
  }
}

function getClient() {
  if (!client) {
    const cfg = getObsConfig()
    client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
  }
  return client
}

export function getPublicUrl(key: string): string {
  const { publicBaseUrl } = getObsConfig()
  return `${publicBaseUrl}/${key}`
}

export async function uploadObject(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  const { bucket } = getObsConfig()
  const data = typeof body === 'string' ? Buffer.from(body, 'utf-8') : body
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
  }))
  return getPublicUrl(key)
}

export async function getObjectText(key: string): Promise<string> {
  const { bucket } = getObsConfig()
  const result = await getClient().send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
  if (!result.Body) {
    throw new Error('Empty object')
  }
  return result.Body.transformToString('utf-8')
}

export async function deleteObject(key: string) {
  const { bucket } = getObsConfig()
  await getClient().send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
}

export async function listObjects(prefix: string) {
  const { bucket } = getObsConfig()
  const result = await getClient().send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  }))
  return result.Contents ?? []
}
