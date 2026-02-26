import { useRegisterSW } from 'virtual:pwa-register/vue'

// Singleton SW registration — shared across UpdatePrompt and SettingsView.
// The onRegisteredSW callback is registered once here so there is only ever
// one active update-check listener, regardless of how many components call usePwa().
let _pwa = null

export function usePwa() {
  if (!_pwa) {
    _pwa = useRegisterSW({
      onRegisteredSW(swUrl, r) {
        if (!r) return

        const checkForUpdate = async () => {
          if (r.installing || !navigator) return
          if ('connection' in navigator && !navigator.onLine) return

          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'cache': 'no-store', 'cache-control': 'no-cache' }
          })
          if (resp?.status === 200) await r.update()
        }

        // Check on app launch
        checkForUpdate()

        // Check when user returns to the PWA
        const handler = () => { if (!document.hidden) checkForUpdate() }
        document.addEventListener('visibilitychange', handler)
        // No cleanup needed — this listener lives for the app lifetime
      }
    })
  }
  return _pwa
}
