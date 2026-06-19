// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    obsAccessKeyId: process.env.OBS_ACCESS_KEY_ID || '',
    obsSecretAccessKey: process.env.OBS_SECRET_ACCESS_KEY || '',
    obsBucket: process.env.OBS_BUCKET || 'dylan-1',
    obsRegion: process.env.OBS_REGION || 'cn-north-4',
    obsEndpoint: process.env.OBS_ENDPOINT || 'https://obs.cn-north-4.myhuaweicloud.com',
    obsPublicBaseUrl: process.env.OBS_PUBLIC_BASE_URL || 'https://dylan-1.obs.cn-north-4.myhuaweicloud.com',
  },
})
