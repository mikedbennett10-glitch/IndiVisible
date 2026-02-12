import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { getServiceWorkerRegistration } from '@/lib/serviceWorker'

type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<PushPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check current state
  useEffect(() => {
    if (!('Notification' in window) || !('PushManager' in window)) {
      setPermission('unsupported')
      setLoading(false)
      return
    }

    setPermission(Notification.permission as PushPermission)

    async function checkSubscription() {
      const registration = await getServiceWorkerRegistration()
      if (!registration) {
        setLoading(false)
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      setSubscribed(!!subscription)
      setLoading(false)
    }

    checkSubscription()
  }, [])

  const subscribe = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)

      if (perm !== 'granted') {
        return { error: 'Permission denied' }
      }

      const registration = await getServiceWorkerRegistration()
      if (!registration) return { error: 'Service worker not available' }

      // Get VAPID public key from env (must be set)
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        return { error: 'VAPID key not configured' }
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys) {
        return { error: 'Invalid subscription' }
      }

      // Store in database
      const { error: dbError } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh!,
          auth: json.keys.auth!,
        },
        { onConflict: 'user_id,endpoint' }
      )

      if (dbError) return { error: dbError.message }

      setSubscribed(true)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to subscribe' }
    }
  }, [user])

  const unsubscribe = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const registration = await getServiceWorkerRegistration()
      if (!registration) return { error: 'Service worker not available' }

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', endpoint)
      }

      setSubscribed(false)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to unsubscribe' }
    }
  }, [user])

  return {
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    isSupported: permission !== 'unsupported',
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
