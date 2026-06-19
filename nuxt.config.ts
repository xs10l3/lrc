// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    obsAccessKeyId: '',
    obsSecretAccessKey: '',
    obsBucket: 'dylan-1',
    obsRegion: 'cn-north-4',
    obsEndpoint: 'https://obs.cn-north-4.myhuaweicloud.com',
    obsPublicBaseUrl: 'https://dylan-1.obs.cn-north-4.myhuaweicloud.com',
  },
})
