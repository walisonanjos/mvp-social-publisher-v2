// src/app/auth/callback/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// MUDANÇA: Usando o atalho '@/' para um caminho mais robusto
import { createClient } from '@/lib/supabaseClient'; 

export default function AuthCallback() {
  const [message, setMessage] = useState('Autenticando com o Google, por favor aguarde...');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      const exchangeCodeForTokens = async () => {
        try {
          // Chama nossa nova função de backend para fazer a troca do código
          const { error: invokeError } = await supabase.functions.invoke('exchange-auth-code', {
            body: { code },
          });

          if (invokeError) throw invokeError;

          setMessage('Sucesso! Redirecionando para o seu painel...');
          // Redireciona de volta para a página principal após 2 segundos
          setTimeout(() => {
            router.push('/');
          }, 2000);

        } catch (e) {
          const errorMsg = (e as Error).message;
          console.error(e);
          setError(`Erro ao conectar sua conta: ${errorMsg}`);
        }
      };
      exchangeCodeForTokens();
    } else {
      setError('Nenhum código de autorização encontrado. Voltando ao início...');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [searchParams, router, supabase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded-lg text-center">
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <p>{message}</p>
        )}
      </div>
    </div>
  );
}