// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Auth from "../components/Auth"; 
import UploadForm from "../components/UploadForm";
import VideoList from "../components/VideoList";
import { createClient } from "../lib/supabaseClient"; 
import { User } from "@supabase/supabase-js";

// Definindo a tipagem para cada objeto de vídeo
interface Video {
  id: string;
  title: string;
  video_url: string;
  scheduled_at: string;
}

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Otimização: Vamos remover o 'refreshKey' e usar Realtime (ver abaixo)

  useEffect(() => {
    const checkUserAndFetchData = async () => {
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

    checkUserAndFetchData();

    // MELHORIA COM SUPABASE REALTIME:
    // Isso escuta o banco de dados e atualiza a tela em tempo real!
    const channel = supabase.channel('videos_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'videos' }, 
        (payload) => {
          // Quando um novo vídeo é inserido, adiciona ele à nossa lista local
          setVideos((currentVideos) => [payload.new as Video, ...currentVideos]);
        }
      )
      .subscribe();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setVideos([]);
        }
      }
    );

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    // MUDANÇA DE ESTILO: Fundo mais escuro para a página toda
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          {/* MUDANÇA: Título da Plataforma Adicionado */}
          <h1 className="text-xl font-bold text-teal-400">
            Social Publisher
          </h1>
          <div className="flex items-center gap-4">
            {/* MUDANÇA: Cor do nome de usuário ajustada */}
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
        {/* MUDANÇA: 'onUploadSuccess' removido, pois o Realtime cuida disso */}
        <UploadForm />
        <hr className="my-8 border-gray-700" />
        <VideoList videos={videos} />
      </main>
    </div>
  );
}