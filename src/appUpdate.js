/**
 * Detect new deployments and reload when index.html points to a newer JS bundle.
 * Logout/login alone does not reload the app shell on mobile browsers.
 */
const getLoadedBundleId = () => {
  const script = [...document.scripts].find((s) => /\/assets\/index-[^/]+\.js/.test(s.src || ''))
  return script?.src.match(/index-([A-Za-z0-9_-]+)\.js/)?.[1] || ''
}

export const checkForAppUpdate = async () => {
  if (!import.meta.env.PROD) return false
  try {
    const res = await fetch(`/index.html?update=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const html = await res.text()
    const remoteId = html.match(/index-([A-Za-z0-9_-]+)\.js/)?.[1] || ''
    const localId = getLoadedBundleId()
    if (remoteId && localId && remoteId !== localId) {
      window.location.reload()
      return true
    }
  } catch {
    // ignore network errors
  }
  return false
}

export const startAppUpdateChecks = () => {
  if (!import.meta.env.PROD) return
  void checkForAppUpdate()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForAppUpdate()
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void checkForAppUpdate()
  })
}
