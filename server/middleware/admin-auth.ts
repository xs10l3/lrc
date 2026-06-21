import { requireAdminAuth } from '../utils/admin-auth'

const ADMIN_API_PREFIXES = [
  '/api/control',
  '/api/images',
  '/api/lyrics',
  '/api/upload',
]

export default defineEventHandler((event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!ADMIN_API_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) {
    return
  }

  requireAdminAuth(event)
})
