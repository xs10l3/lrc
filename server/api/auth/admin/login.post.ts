import {
  createAdminSession,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  if (!isAdminPasswordConfigured()) {
    throw createError({ statusCode: 500, message: '未配置 ADMIN_PASSWORD' })
  }

  const body = await readBody(event)
  const password = String(body?.password ?? '')

  if (!verifyAdminPassword(password)) {
    throw createError({ statusCode: 401, message: '密码错误' })
  }

  createAdminSession(event)
  return { ok: true }
})
