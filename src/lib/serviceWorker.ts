export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000) // Every hour

    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

export async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.ready
}
