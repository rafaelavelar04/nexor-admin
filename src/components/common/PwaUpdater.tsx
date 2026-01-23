import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PwaUpdater = () => {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      console.log('App is ready to work offline.');
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, please refresh manually.');
    }
  }, [needRefresh]);

  return null;
};