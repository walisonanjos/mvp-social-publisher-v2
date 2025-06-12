// src/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Corrigindo o caminho do import
import AuthForm from "@/components/AuthForm";
import UploadForm from "@/components/UploadForm";
import VideoList from "@/components/VideoList";
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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchVideos(data.user.id);
      }
      setLoading(false);
    };

    const fetchVideos = async (userId: string) => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar vídeos:", error);
      } else {
        setVideos(data as Video[]);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchVideos(currentUser.id);
        } else {
          setVideos([]);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          Olá, {user.email?.split("@")[0]}
        </h1>
        <button
          onClick={async () => await supabase.auth.signOut()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
      <UploadForm
        user={user}
        onUploadSuccess={() => setRefreshKey(refreshKey + 1)}
      />
      <hr className="my-8 border-gray-700" />
      
      {/* AQUI ESTÁ A CORREÇÃO:
        Estamos passando a prop 'videos' para o componente VideoList.
      */}
      <VideoList videos={videos} />

    </div>
  );
}