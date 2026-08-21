'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isUpdateAvailable: boolean;
  installPWA: () => Promise<boolean>;
  updatePWA: () => void;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Check standalone mode
  const checkIsInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    return Boolean(isStandalone);
  }, []);

  // Check iOS device
  const checkIsIOS = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    return isIosDevice;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initial State
    setIsOnline(navigator.onLine);
    setIsInstalled(checkIsInstalled());
    setIsIOS(checkIsIOS());

    // 2. Online / Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. BeforeInstallPrompt Event (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    // 4. App Installed Event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Register Service Worker in production / supported environments
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      const swUrl = '/sw.js';

      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/',
          });

          // Check if there is already a waiting worker
          if (registration.waiting) {
            waitingWorkerRef.current = registration.waiting;
            setIsUpdateAvailable(true);
          }

          // Listen for new service worker being installed
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New update is ready
                  waitingWorkerRef.current = newWorker;
                  setIsUpdateAvailable(true);
                }
              });
            }
          });

          // Periodic check for updates every 1 hour
          const intervalId = window.setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);

          return () => window.clearInterval(intervalId);
        } catch (error) {
          console.warn('[PWA] Service Worker registration failed:', error);
        }
      };

      // Register after page load
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }

      // Controller change listener for auto-reload after skipWaiting
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkIsInstalled, checkIsIOS]);

  // Install PWA Trigger
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt();
        const choiceResult = await deferredPromptRef.current.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          deferredPromptRef.current = null;
          return true;
        }
      } catch (err) {
        console.error('[PWA] Error triggering install prompt:', err);
      }
    } else if (isIOS) {
      setShowInstallGuide(true);
    }
    return false;
  }, [isIOS]);

  // Update PWA Trigger
  const updatePWA = useCallback(() => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, []);

  return {
    isOnline,
    isInstalled,
    isInstallable,
    isIOS,
    isUpdateAvailable,
    installPWA,
    updatePWA,
    showInstallGuide,
    setShowInstallGuide,
  };
}
