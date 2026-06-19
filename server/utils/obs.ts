import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export interface ObsConfig {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region: string
  endpoint: string
  publicBaseUrl: string
}

function env(key: string, fallback = '') {
  return (process.env[key] ?? fallback).trim()
}

export function getObsConfig(): ObsConfig {
  const config = useRuntimeConfig()
  return {
    accessKeyId: (config.obsAccessKeyId as string) || env('OBS_ACCESS_KEY_ID') || env('NUXT_OBS_ACCESS_KEY_ID'),
    secretAccessKey: (config.obsSecretAccessKey as string) || env('OBS_SECRET_ACCESS_KEY') || env('NUXT_OBS_SECRET_ACCESS_KEY'),
    bucket: (config.obsBucket as string) || env('OBS_BUCKET', 'dylan-1'),
    region: (config.obsRegion as string) || env('OBS_REGION', 'cn-north-4'),
    endpoint: (config.obsEndpoint as string) || env('OBS_ENDPOINT', 'https://obs.cn-north-4.myhuaweicloud.com'),
    publicBaseUrl: ((config.obsPublicBaseUrl as string) || env('OBS_PUBLIC_BASE_URL', 'https://dylan-1.obs.cn-north-4.myhuaweicloud.com')).replace(/\/$/, ''),
  }
}

export function assertObsConfigured(cfg: ObsConfig) {
  if (!cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error('OBS 凭证未配置，请在服务器设置 OBS_ACCESS_KEY_ID 和 OBS_SECRET_ACCESS_KEY')
  }
}

function createClient(cfg: ObsConfig) {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

export function getPublicUrl(key: string): string {
  const { publicBaseUrl } = getObsConfig()
  return `${publicBaseUrl}/${key}`
}

export async function uploadObject(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  const cfg = getObsConfig()
  assertObsConfigured(cfg)
  const data = typeof body === 'string' ? Buffer.from(body, 'utf-8') : body
  await createClient(cfg).send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
  }))
  return getPublicUrl(key)
}

export async function getObjectText(key: string): Promise<string> {
  const cfg = getObsConfig()
  assertObsConfigured(cfg)
  const result = await createClient(cfg).send(new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
  }))
  if (!result.Body) {
    throw new Error('Empty object')
  }
  return result.Body.transformToString('utf-8')
}

export async function deleteObject(key: string) {
  const cfg = getObsConfig()
  assertObsConfigured(cfg)
  await createClient(cfg).send(new DeleteObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
  }))
}

export async function listObjects(prefix: string) {
  const cfg = getObsConfig()
  assertObsConfigured(cfg)
  const result = await createClient(cfg).send(new ListObjectsV2Command({
    Bucket: cfg.bucket,
    Prefix: prefix,
  }))
  return result.Contents ?? []
}
