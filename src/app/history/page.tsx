// src/app/history/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation'; // Importando o router para navegação
import Link from 'next/link'; // Importando o componente Link
import { createClient } from "../../lib/supabaseClient"; // Ajustando o caminho do import
import { User } from "@supabase/supabase-js";
import VideoList from "../../components/VideoList"; // Ajustando o caminho do import
import { Video } from "../page"; // Reutilizando a interface da página principal

export default function HistoryPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Lógica para buscar os vídeos (por enquanto, busca todos)
  const fetchHistoryVideos = useCallback(async (userId: string) => {
    // FUTURAMENTE: Vamos filtrar para buscar apenas vídeos do passado.
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false }); // Ordena do mais recente para o mais antigo

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
      if (user) {
        await fetchHistoryVideos(user.id);
      }
      setLoading(false);
    };
    setupPage();
  }, [fetchHistoryVideos, supabase]);


  const groupedVideos = useMemo(() => {
    // Lógica de agrupamento permanece a mesma
    const groups: { [key: string]: Video[] } = {};
    videos.forEach((video) => {
      const dateKey = new Date(video.scheduled_at).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(video);
    });
    return groups;
  }, [videos]);

  // A função de deletar não será passada para o histórico por enquanto
  const handleDeleteVideo = async (videoId: string) => {
    // Implementar lógica de exclusão no histórico se desejado no futuro
    alert(`Funcionalidade de deletar do histórico ainda não implementada. ID: ${videoId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Carregando Histórico...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-teal-400">
            Social Publisher
          </h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-gray-300">Olá, <strong className="font-medium text-white">{user.email?.split("@")[0]}</strong></span>}
            {/* Link para voltar ao Dashboard */}
            <Link href="/" className="text-sm font-medium text-teal-400 hover:text-teal-300">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-8">
            Histórico de Postagens
        </h2>
        <VideoList groupedVideos={groupedVideos} onDelete={handleDeleteVideo} />
      </main>
    </div>
  );
}