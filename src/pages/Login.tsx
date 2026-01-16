import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-[420px] p-6 sm:p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700">
        <img 
          src="/branding/Nexor SF.png" 
          alt="Nexor Logo" 
          className="mx-auto h-auto w-[200px] md:w-[260px]" 
        />
        <p className="text-center text-gray-400 !-mt-2">
          Acesse seu painel administrativo
        </p>
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          showLinks={false}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#00bfff',
                  brandAccent: '#00aeee',
                  defaultButtonBackground: '#1f2937',
                  defaultButtonBackgroundHover: '#374151',
                  inputBackground: '#374151',
                  inputBorder: '#4b5563',
                  inputText: 'white',
                  inputLabelText: '#d1d5db',
                },
              },
            },
          }}
          providers={[]}
          theme="dark"
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