import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const VAPID_PUBLIC_KEY = 'BGvBujneuWUujCNkQNzVzakxe4mXPUvc205SnGIsCjFJs14TPZSOFJsZeSaWpQYwGXg6EStu5WIzVRaIK6Q1WPME';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function registerPushSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    // Register our dedicated push service worker
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/',
    });

    // Wait for it to be active
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', function handler() {
          if (this.state === 'activated') {
            this.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (err) {
    console.error('Push SW registration failed:', err);
    return null;
  }
}

export function usePushSubscription() {
  const { user } = useAuth();
  const subscribedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!user || subscribedRef.current) return;

    // Check if we're in a preview/iframe context — skip
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }
    if (window.location.hostname.includes('id-preview--')) return;

    // Check notification permission
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') return;
    } else if (Notification.permission !== 'granted') {
      return;
    }

    const registration = await registerPushSW();
    if (!registration) return;

    try {
      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      if (!subscription) return;

      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) return;

      const endpoint = subscription.endpoint;
      const p256dh = keys.p256dh;
      const auth = keys.auth;

      // Save to database (upsert by user_id + endpoint)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          { user_id: user.id, endpoint, p256dh, auth },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('Failed to save push subscription:', error);
      } else {
        subscribedRef.current = true;
        console.log('Push subscription saved successfully');
      }
    } catch (err) {
      console.error('Push subscription error:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Small delay to not block initial render
      const timer = setTimeout(() => subscribe(), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, subscribe]);
}
