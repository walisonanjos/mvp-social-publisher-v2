// src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

import Auth from '@/components/Auth';
import UploadForm from '@/components/UploadForm';
import VideoList from '@/components/VideoList';
import Link from 'next/link'; // NOVIDADE 1: Importamos o componente de Link

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); 
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUploadSuccess = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    // Adicionamos um pouco de preenchimento e cor de fundo à página inteira
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 underline mb-8">
          Minha Plataforma de Posts!
        </h1>
        {!session ? (
          <Auth />
        ) : (
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <p>Bem-vindo(a), <span className="font-medium">{session.user.email}</span>!</p>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="bg-slate-200 text-slate-800 px-3 py-1 text-sm font-medium rounded-md hover:bg-slate-300"
              >
                Sair
              </button>
              
              {/* --- NOVIDADE 2: O LINK PARA AS CONFIGURAÇÕES --- */}
              <Link href="/settings" className="text-blue-600 hover:underline font-medium text-sm">
                Configurações
              </Link>
            </div>
            
            <hr className="my-6" />
            
            <h3 className="text-xl font-semibold mb-4">Enviar novo vídeo</h3>
            <UploadForm onUploadSuccess={handleUploadSuccess} />

            <hr className="my-8" />

            <VideoList key={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}