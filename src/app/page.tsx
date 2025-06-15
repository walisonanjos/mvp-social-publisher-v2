// src/app/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from 'next/link';
import Auth from "../components/Auth";
import UploadForm from "../components/UploadForm";
import VideoList from "../components/VideoList";
import { createClient } from "../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar"; // Importando o novo componente

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

  // ... (toda a lógica de fetch, group, delete, etc., permanece igual) ...
  const fetchVideos = useCallback(async (userId: string) => {
    // FILTRAGEM: Busca apenas agendamentos de hoje em diante
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .gte('scheduled_at', today) // gte = greater than or equal to
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar vídeos:", error);
    } else {
      setVideos(data || []);
    }
  }, [supabase]);

  const groupedVideos = useMemo(() => {
    const groups: { [key: string]: Video[] } = {};
    videos.forEach((video) => {
      const dateKey = new Date(video.scheduled_at).toISOString().split('T')[0];
      if (!groups[dateKey]) { groups[dateKey] = []; }
      groups[dateKey].push(video);
    });
    return groups;
  }, [videos]);

  useEffect(() => {
    const setupPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) { await fetchVideos(user.id); }
      setLoading(false);
    };
    setupPage();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) { fetchVideos(currentUser.id); } 
      else { setVideos([]); }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [supabase, fetchVideos]);
  
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`videos_realtime_user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
        fetchVideos(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [user, supabase, fetchVideos]);
  
  const handleDeleteVideo = async (videoId: string) => {
    setVideos(currentVideos => currentVideos.filter(v => v.id !== videoId));
    const { error } = await supabase.from('videos').delete().match({ id: videoId });
    if (error) {
      console.error('Erro ao deletar agendamento:', error);
      alert('Não foi possível excluir o agendamento. Tente novamente.');
    }
  };

  if (loading) { /* ... (tela de loading) ... */ return <div className="flex items-center justify-center min-h-screen bg-gray-900"><p className="text-white">Carregando...</p></div>; }
  if (!user) { return <Auth />; }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-400">Social Publisher</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Olá, <strong className="font-medium text-white">{user.email?.split("@")[0]}</strong></span>
            {/* MUDANÇA: Link do histórico foi removido daqui */}
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
        {/* MUDANÇA: Adicionada a nova barra de navegação */}
        <Navbar />
        <div className="mt-8">
            <UploadForm />
        </div>
        <hr className="my-8 border-gray-700" />
        <div className="flex justify-between items-center mb-6">
            {/* ... (código do botão de atualizar) ... */}
            <button onClick={() => user && fetchVideos(user.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors" title="Atualizar lista">
                <RefreshCw size={14} /><span>Atualizar</span>
            </button>
        </div>
        <VideoList groupedVideos={groupedVideos} onDelete={handleDeleteVideo} />
      </main>
    </div>
  );
}