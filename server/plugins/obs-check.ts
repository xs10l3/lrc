export default defineNitroPlugin(() => {
  const cfg = getObsConfig()
  if (!cfg.accessKeyId || !cfg.secretAccessKey) {
    console.warn('[OBS] 未配置凭证，上传/歌词存储不可用。请在服务器设置 OBS_ACCESS_KEY_ID 和 OBS_SECRET_ACCESS_KEY')
    return
  }
  console.log(`[OBS] 已就绪，bucket=${cfg.bucket}, endpoint=${cfg.endpoint}`)
})
