/** Anyone can score a game in the open version; saved games and series need the password. */
const PUBLIC = (path: string) => path === '/' || path === '/login' || path.startsWith('/open')

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (to.path === '/login') {
    if (loggedIn.value) return navigateTo('/')
    return
  }

  if (!PUBLIC(to.path) && !loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
