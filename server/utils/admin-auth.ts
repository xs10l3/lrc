import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'
import type { H3Event } from 'h3'

const COOKIE_NAME = 'lrc_admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

interface AdminSession {
  createdAt: number
  expiresAt: number
  lastSeenAt: number
}

const sessions = new Map<string, AdminSession>()

function now() {
  return Date.now()
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function cleanupExpiredSessions() {
  const current = now()
  for (const [tokenHash, session] of sessions) {
    if (session.expiresAt <= current) sessions.delete(tokenHash)
  }
}

function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || process.env.NUXT_ADMIN_PASSWORD || '').trim()
}

export function isAdminPasswordConfigured() {
  return getAdminPassword().length > 0
}

export function verifyAdminPassword(password: string) {
  const configured = getAdminPassword()
  if (!configured) return false

  const expected = createHash('sha256').update(configured).digest()
  const received = createHash('sha256').update(password).digest()
  return timingSafeEqual(expected, received)
}

export function createAdminSession(event: H3Event) {
  cleanupExpiredSessions()

  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const current = now()
  sessions.set(tokenHash, {
    createdAt: current,
    expiresAt: current + SESSION_TTL_MS,
    lastSeenAt: current,
  })

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearAdminSession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (token) sessions.delete(hashToken(token))
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function isAdminAuthenticated(event: H3Event) {
  cleanupExpiredSessions()

  const token = getCookie(event, COOKIE_NAME)
  if (!token) return false

  const tokenHash = hashToken(token)
  const session = sessions.get(tokenHash)
  if (!session) return false

  const current = now()
  if (session.expiresAt <= current) {
    sessions.delete(tokenHash)
    return false
  }

  session.lastSeenAt = current
  return true
}

export function requireAdminAuth(event: H3Event) {
  if (isAdminAuthenticated(event)) return
  throw createError({ statusCode: 401, message: '请先登录管理端' })
}
