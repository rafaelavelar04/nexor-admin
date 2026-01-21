import { createContext, useContext, ReactNode, useRef } from 'react';
import { toast } from 'sonner';
import { showSuccess } from '@/utils/toast';

const UNDO_TIMEOUT = 10000; // 10 segundos

interface ActionConfig {
  action: () => Promise<any>;
  undoAction: () => Promise<any>;
  message: string;
}

interface ActionManagerContextValue {
  performAction: (config: ActionConfig) => void;
}

const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);

export const ActionManagerProvider = ({ children }: { children: ReactNode }) => {
  const timeoutRef = useRef<number | null>(null);

  const performAction = async ({ action, undoAction, message }: ActionConfig) => {
    try {
      // Executa a ação principal imediatamente
      await action();

      const toastId = toast.info(message, {
        duration: UNDO_TIMEOUT,
        action: {
          label: 'Desfazer',
          onClick: () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            toast.dismiss(toastId);
            handleUndo(undoAction);
          },
        },
      });

      // Inicia um timer para a confirmação final (se necessário no futuro)
      timeoutRef.current = window.setTimeout(() => {
        // A ação já foi executada, então aqui poderíamos registrar um log de confirmação final.
        console.log(`Ação "${message}" confirmada definitivamente.`);
        timeoutRef.current = null;
      }, UNDO_TIMEOUT);

    } catch (error: any) {
      toast.error(`Falha na ação: ${error.message}`);
    }
  };

  const handleUndo = async (undoAction: () => Promise<any>) => {
    try {
      await undoAction();
      showSuccess('Ação desfeita com sucesso.');
      // Aqui poderíamos registrar um log de "undo".
      console.log('Ação desfeita.');
    } catch (error: any) {
      toast.error(`Falha ao desfazer: ${error.message}`);
    }
  };

  return (
    <ActionManagerContext.Provider value={{ performAction }}>
      {children}
    </ActionManagerContext.Provider>
  );
};

export const useActionManager = () => {
  const context = useContext(ActionManagerContext);
  if (context === undefined) {
    throw new Error('useActionManager must be used within an ActionManagerProvider');
  }
  return context;
};