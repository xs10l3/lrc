import { isAdminAuthenticated, isAdminPasswordConfigured } from '../../../utils/admin-auth'

export default defineEventHandler((event) => {
  return {
    authenticated: isAdminAuthenticated(event),
    configured: isAdminPasswordConfigured(),
  }
})
