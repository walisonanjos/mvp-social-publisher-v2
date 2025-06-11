// COPIE E COLE ISTO EM: src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

import Auth from '@/components/Auth';
import UploadForm from '@/components/UploadForm';
import VideoList from '@/components/VideoList';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Gatilho para atualizar a lista
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
    setRefreshKey(oldKey => oldKey + 1); // Atualiza o gatilho
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-600 underline">
  Minha Plataforma de Posts
</h1>
      {!session ? (
        <Auth />
      ) : (
        <div>
          <p>Bem-vindo(a), {session.user.email}!</p>
          <button onClick={() => supabase.auth.signOut()}>Sair</button>
          
          <hr style={{ margin: '2rem 0' }} />
          
          <h3>Enviar novo vídeo</h3>
          <UploadForm onUploadSuccess={handleUploadSuccess} />

          <hr style={{ margin: '2rem 0' }} />

          <VideoList key={refreshKey} />
        </div>
      )}
    </div>
  );
}