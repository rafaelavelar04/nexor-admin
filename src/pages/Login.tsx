import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const Login = () => {
  const { session, loading } = useSession();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-[420px] p-6 sm:p-8 space-y-6 bg-card rounded-lg shadow-lg border">
        <img 
          src="/branding/Nexor SF.png" 
          alt="Nexor Logo" 
          className="mx-auto h-auto w-[200px] md:w-[260px]" 
        />
        <p className="text-center text-muted-foreground !-mt-2">
          Acesse seu painel administrativo
        </p>
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          showLinks={false}
          appearance={{ theme: ThemeSupa }}
          theme={theme === 'dark' ? 'dark' : 'default'}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;