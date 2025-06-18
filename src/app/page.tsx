// src/app/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Auth from "../components/Auth";
import UploadForm from "../components/UploadForm";
import VideoList from "../components/VideoList";
import { createClient } from "../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import AccountConnection from "../components/AccountConnection";

export interface Video {
  // ... (interface Video permanece igual)
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
  // MUDANÇA: Novo estado para controlar a conexão com o YouTube
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);

  // ... (groupedVideos e sortVideos permanecem iguais)
  const groupedVideos = useMemo(() => { /* ... */ }, [videos]);

  const fetchPageData = useCallback(async (userId: string) => {
    // Busca os vídeos agendados
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const { data: videosData, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .gte('scheduled_at', todayISO)
      .order("scheduled_at", { ascending: true });

    if (videosError) console.error("Erro ao buscar vídeos:", videosError);
    else setVideos(videosData || []);

    // MUDANÇA: Verifica se há tokens do YouTube para o usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('youtube_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .single(); // .single() pega um registro ou retorna null/erro se não achar
    
    if (tokenError && tokenError.code !== 'PGRST116') { // Ignora erro 'PGRST116' (nenhuma linha encontrada)
        console.error("Erro ao verificar token do YouTube:", tokenError);
    }
    setIsYouTubeConnected(!!tokenData); // Define como true se encontrar dados, senão false

  }, [supabase]);

  useEffect(() => {
    const setupPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) { await fetchPageData(user.id); }
      setLoading(false);
    };
    setupPage();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) { fetchPageData(currentUser.id); } 
      else { setVideos([]); setIsYouTubeConnected(false); }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [supabase, fetchPageData]);
  
  // ... (useEffect de Realtime permanece igual) ...
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`videos_realtime_user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => {
        if (user) { fetchPageData(user.id); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); }
  }, [user, supabase, fetchPageData]);
  
  // MUDANÇA: Nova função para desconectar a conta do YouTube
  const handleDisconnectYouTube = async () => {
    if (!user) return;
    const { error } = await supabase.from('youtube_tokens').delete().match({ user_id: user.id });
    if (error) {
      alert("Erro ao desconectar a conta.");
    } else {
      setIsYouTubeConnected(false);
      alert("Conta do YouTube desconectada com sucesso.");
    }
  };

  const handleDeleteVideo = async (videoId: string) => { /* ... (sem mudanças) ... */ };

  if (loading) { return <div className="flex items-center justify-center min-h-screen bg-gray-900"><p className="text-white">Carregando...</p></div>; }
  if (!user) { return <Auth />; }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header> {/* ... (sem mudanças) ... */} </header>
      <main className="container mx-auto p-4 md:p-8">
        <Navbar />
        <div className="mt-8"><UploadForm /></div>
        
        <div className="mt-8">
          {/* MUDANÇA: Passando o status e a função de desconectar para o componente */}
          <AccountConnection 
            isYouTubeConnected={isYouTubeConnected}
            onDisconnectYouTube={handleDisconnectYouTube}
          />
        </div>

        <hr className="my-8 border-gray-700" />
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">Meus Agendamentos</h2>
            <button onClick={() => user && fetchPageData(user.id)} /* ... */ >
                <RefreshCw size={14} /><span>Atualizar</span>
            </button>
        </div>
        <VideoList groupedVideos={groupedVideos} onDelete={handleDeleteVideo} />
      </main>
    </div>
  );
}