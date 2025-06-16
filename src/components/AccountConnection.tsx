// src/components/AccountConnection.tsx

'use client';

import { useState } from 'react';
import { Youtube } from 'lucide-react';
import { createClient } from '../lib/supabaseClient';

export default function AccountConnection() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Chamando nossa função de backend para pegar a URL de autorização
      const { data, error } = await supabase.functions.invoke('generate-youtube-auth-url');

      if (error) throw error;

      // Redireciona o usuário para a página de consentimento do Google
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      alert('Não foi possível iniciar a conexão com o YouTube. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Conectar Contas</h2>
      <p className="text-gray-400 mb-6">
        Conecte suas contas de redes sociais para começar a agendar suas postagens.
      </p>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-red-600/50 bg-red-600/20 hover:bg-red-600/30 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        <Youtube size={20} />
        <span>{isLoading ? 'Aguarde...' : 'Conectar com YouTube'}</span>
      </button>
    </div>
  );
}