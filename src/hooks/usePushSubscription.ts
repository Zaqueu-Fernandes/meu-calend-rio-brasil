import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const VAPID_PUBLIC_KEY = 'BGvBujneuWUujCNkQNzVzakxe4mXPUvc205SnGIsCjFJs14TPZSOFJsZeSaWpQYwGXg6EStu5WIzVRaIK6Q1WPME';
const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}sw.js`;

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

function isSupportedEnvironment() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

function isPushEnabledContext() {
  try {
    if (window.self !== window.top && !window.matchMedia('(display-mode: standalone)').matches) return false;
  } catch {
    return false;
  }

  return !window.location.hostname.includes('id-preview--');
}

async function getMainServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) return existingRegistration;

    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: import.meta.env.BASE_URL,
    });

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
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSubscription = useCallback(async (subscription: PushSubscription) => {
    if (!user) return false;

    const keys = subscription.toJSON().keys;
    if (!keys?.p256dh || !keys?.auth) return false;

    const endpoint = subscription.endpoint;
    const p256dh = keys.p256dh;
    const auth = keys.auth;

    const { data: existing, error: existingError } = await supabase
      .from('push_subscriptions')
      .select('id, p256dh, auth')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (existingError) {
      console.error('Failed to read push subscription:', existingError);
      return false;
    }

    if (existing) {
      if (existing.p256dh === p256dh && existing.auth === auth) return true;

      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);

      if (deleteError) {
        console.error('Failed to refresh push subscription:', deleteError);
        return false;
      }
    }

    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({ user_id: user.id, endpoint, p256dh, auth });

    if (insertError) {
      console.error('Failed to save push subscription:', insertError);
      return false;
    }

    return true;
  }, [user]);

  const subscribe = useCallback(async (requestPermission = false) => {
    if (!user || !isPushEnabledContext()) return false;

    if (!isSupportedEnvironment()) {
      setIsSupported(false);
      setPermission('unsupported');
      return false;
    }

    setIsSupported(true);
    setError(null);
    setIsLoading(true);

    try {
      let nextPermission = Notification.permission;

      if (nextPermission === 'default' && requestPermission) {
        nextPermission = await Notification.requestPermission();
      }

      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        subscribedRef.current = false;
        setIsSubscribed(false);

        if (nextPermission === 'denied') {
          setError('As notificações estão bloqueadas no navegador ou no PWA.');
        }

        return false;
      }

      const registration = await getMainServiceWorkerRegistration();
      if (!registration) {
        setError('Não foi possível inicializar o serviço de notificações em segundo plano.');
        return false;
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      if (!subscription) {
        setError('Não foi possível concluir a assinatura das notificações.');
        return false;
      }

      const saved = await persistSubscription(subscription);

      if (saved) {
        subscribedRef.current = true;
        setIsSubscribed(true);
        console.log('Push subscription saved successfully');
        return true;
      }

      setError('Não foi possível salvar este dispositivo para receber notificações.');
      return false;
    } catch (err) {
      subscribedRef.current = false;
      setIsSubscribed(false);
      setError('Falha ao ativar notificações push neste dispositivo.');
      console.error('Push subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [persistSubscription, user]);

  useEffect(() => {
    if (!user) {
      subscribedRef.current = false;
      setIsSubscribed(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!isPushEnabledContext() || !isSupportedEnvironment()) {
      setIsSupported(false);
      setPermission('unsupported');
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    if (Notification.permission === 'granted') {
      const timer = setTimeout(() => {
        void subscribe(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, subscribe]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    enablePush: () => subscribe(true),
  };
}
