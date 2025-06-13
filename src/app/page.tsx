// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Auth from "../components/Auth";
import UploadForm from "../components/UploadForm";
import VideoList from "../components/VideoList";
import { createClient } from "../lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export interface Video {
  id: string;
  title: string;
  video_url: string;
  scheduled_at: string;
  is_posted: boolean; // Usando a coluna que já existe
}

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Função helper para ordenar os vídeos
  const sortVideos = (videoArray: Video[]) => {
    return videoArray.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  };

  useEffect(() => {
    const setupPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: initialVideos, error } = await supabase
          .from("videos")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_at", { ascending: true }); // A ordenação inicial já estava correta

        if (error) {
          console.error("Erro ao buscar vídeos:", error);
        } else {
          setVideos(initialVideos || []);
        }
      }
      setLoading(false);
    };

    setupPage();

    const channel = supabase.channel('videos_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'videos' },
        (payload) => {
          // CORREÇÃO DA ORDENAÇÃO
          setVideos((currentVideos) => sortVideos([...currentVideos, payload.new as Video]));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'videos' },
        (payload) => {
          // ADIÇÃO: Lógica para remover em tempo real
          setVideos((currentVideos) => currentVideos.filter(v => v.id !== payload.old.id));
        }
      )
      .subscribe();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (!currentUser) setVideos([]);
      }
    );

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);
  
  // ADIÇÃO: Função para deletar agendamento
  const handleDeleteVideo = async (videoId: string) => {
    // Atualização otimista da UI
    setVideos(currentVideos => currentVideos.filter(v => v.id !== videoId));

    const { error } = await supabase.from('videos').delete().match({ id: videoId });

    if (error) {
      console.error('Erro ao deletar agendamento:', error);
      alert('Não foi possível excluir o agendamento. Tente novamente.');
      // Opcional: re-fetch dos vídeos para reverter a UI em caso de erro
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-400">
            Social Publisher
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Olá, <strong className="font-medium text-white">{user.email?.split("@")[0]}</strong></span>
            <button
              onClick={async () => await supabase.auth.signOut()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <UploadForm />
        <hr className="my-8 border-gray-700" />
        {/* ADIÇÃO: Passando a função de deletar para o componente da lista */}
        <VideoList videos={videos} onDelete={handleDeleteVideo} />
      </main>
    </div>
  );
}