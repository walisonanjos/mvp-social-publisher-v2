// src/app/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react"; // Adicionado useMemo
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
  is_posted: boolean;
  target_instagram: boolean;
  target_facebook: boolean;
  target_youtube: boolean;
  target_tiktok: boolean;
  target_kwai: boolean;
}

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const sortVideos = (videoArray: Video[]) => {
    return videoArray.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  };

  // MUDANÇA PRINCIPAL: Agrupando os vídeos por dia
  const groupedVideos = useMemo(() => {
    const groups: { [key: string]: Video[] } = {};
    videos.forEach((video) => {
      const date = new Date(video.scheduled_at).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(video);
    });
    return groups;
  }, [videos]);


  useEffect(() => {
    // ... (nenhuma mudança dentro do useEffect, ele permanece igual)
    const setupPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: initialVideos, error } = await supabase
          .from("videos")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_at", { ascending: true });

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
          setVideos((currentVideos) => sortVideos([...currentVideos, payload.new as Video]));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'videos' },
        (payload) => {
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
  
  const handleDeleteVideo = async (videoId: string) => {
    setVideos(currentVideos => currentVideos.filter(v => v.id !== videoId));
    const { error } = await supabase.from('videos').delete().match({ id: videoId });
    if (error) {
      console.error('Erro ao deletar agendamento:', error);
      alert('Não foi possível excluir o agendamento. Tente novamente.');
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
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-20">
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
        {/* Passando os vídeos agrupados e a função de deletar */}
        <VideoList groupedVideos={groupedVideos} onDelete={handleDeleteVideo} />
      </main>
    </div>
  );
}