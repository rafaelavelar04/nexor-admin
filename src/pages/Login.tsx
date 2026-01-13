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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <img src="/branding/Nexor SF.png" alt="Nexor Logo" className="w-52 md:w-72" />
          <p className="text-gray-400">Acesse seu painel administrativo</p>
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
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Crie uma senha',
                button_label: 'Criar conta',
                loading_button_label: 'Criando...',
                link_text: 'Não tem uma conta? Crie uma agora',
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                email_label: 'E-mail',
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar instruções',
                loading_button_label: 'Enviando...',
                confirmation_text: 'Verifique seu e-mail para o link de redefinição de senha.',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar senha',
                loading_button_label: 'Atualizando...',
                confirmation_text: 'Sua senha foi atualizada.',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;