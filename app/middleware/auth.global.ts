import { authClient } from '../utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    console.log({ session: session.value })
    if (to.path !== '/auth') {
      return navigateTo('/auth')
    }
  } else {
    console.log({ session: session.value })
    // User is logged in
    const role = session?.value?.user?.role
    //if (role === 'VOLUNTEER') {
    //  // Volunteers can only access /rides and its sub-paths, and /settings
    //  if (!to.path.startsWith('/rides') && to.path !== '/settings') {
    //    return navigateTo('/rides')
    //  }
    //}
    if (to.path === '/auth') {
      return navigateTo('/')
    }
  }
})
