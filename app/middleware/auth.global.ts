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
    const userId = session?.value?.user?.id

    if (role === 'SUPERVISOR') {
      const targetPath = `/supervisor/${userId}`
      if (to.path !== targetPath) {
        return navigateTo(targetPath)
      }
    }

    if (role === 'ONBOARDING') {
      const targetPath = `/onboarding/${userId}`
      if (to.path !== targetPath) {
        return navigateTo(targetPath)
      }
    }

    if (to.path === '/auth') {
      return navigateTo('/')
    }
  }
})
