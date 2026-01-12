import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const { session } = useSession();

  useEffect(() => {
    // This is for when the user signs in, the page will redirect
    if (session) {
      window.location.href = '/admin';
    }
  }, [session]);

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Nexor Admin</h1>
          <p className="text-gray-400">Acesse seu painel</p>
        </div>
        <Auth
          supabaseClient={supabase}
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
                email_label: 'Seu endereço de e-mail',
                password_label: 'Sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
              },
              sign_up: {
                email_label: 'Seu endereço de e-mail',
                password_label: 'Sua senha',
                button_label: 'Registrar',
                loading_button_label: 'Registrando...',
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;