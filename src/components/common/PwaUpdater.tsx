import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export const PwaUpdater = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
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
      toast.success('O aplicativo está pronto para funcionar offline.');
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      // Check if the user has already dismissed the update notification in this session
      if (sessionStorage.getItem('pwa-update-dismissed') === 'true') {
        return;
      }

      const toastId = toast(
        <div className="flex items-center gap-3">
          <Rocket className="h-5 w-5 flex-shrink-0 text-primary" />
          <div className="flex-grow">
            <p className="font-semibold">Nova versão disponível</p>
            <p className="text-sm text-muted-foreground">
              Atualize para a versão mais recente.
            </p>
          </div>
        </div>,
        {
          id: 'pwa-update-toast', // Use a consistent ID to prevent duplicates
          duration: Infinity,
          dismissible: true,
          action: (
            <Button
              size="sm"
              onClick={() => {
                updateServiceWorker(true);
              }}
            >
              Atualizar
            </Button>
          ),
          onDismiss: () => {
            // Mark as dismissed for this session to prevent it from reappearing
            sessionStorage.setItem('pwa-update-dismissed', 'true');
            setNeedRefresh(false);
          },
        }
      );

      return () => {
        toast.dismiss(toastId);
      };
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
};