// src/app/history/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
// MUDANÇA: O import do 'Link' foi removido daqui também
import { createClient } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import VideoList from "../../components/VideoList";
import { Video } from "../page";
import Navbar from "../../components/Navbar";

export default function HistoryPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistoryVideos = useCallback(async (userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Define para o início do dia
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .lt('scheduled_at', todayISO)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico de vídeos:", error);
    } else {
      setVideos(data || []);
    }
  }, [supabase]);

  useEffect(() => {
    const setupPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) { await fetchHistoryVideos(user.id); }
      setLoading(false);
    };
    setupPage();
  }, [fetchHistoryVideos, supabase]);

  const groupedVideos = useMemo(() => {
    const groups: { [key: string]: Video[] } = {};
    videos.forEach((video) => {
      const dateKey = new Date(video.scheduled_at).toISOString().split('T')[0];
      if (!groups[dateKey]) { groups[dateKey] = []; }
      groups[dateKey].push(video);
    });
    return groups;
  }, [videos]);

  const handleDeleteVideo = async (videoId: string) => {
    alert(`Funcionalidade de deletar do histórico ainda não implementada. ID: ${videoId}`);
  };

  if (loading) { return <div className="flex items-center justify-center min-h-screen bg-gray-900"><p className="text-white">Carregando Histórico...</p></div>; }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-400">Social Publisher</h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-gray-300">Olá, <strong className="font-medium text-white">{user.email?.split("@")[0]}</strong></span>}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Navbar />
        <div className="mt-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-8">
                Histórico de Postagens
            </h2>
            <VideoList groupedVideos={groupedVideos} onDelete={handleDeleteVideo} />
        </div>
      </main>
    </div>
  );
}