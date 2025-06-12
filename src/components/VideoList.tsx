// src/components/VideoList.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';

type Video = {
  id: number;
  created_at: string;
  video_url: string;
  user_id: string;
  scheduled_at: string;
  title: string;
};

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleDelete = async (videoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return;
    }
    try {
      const { error } = await supabase.from('videos').delete().match({ id: videoId });
      if (error) throw error;
      setVideos(currentVideos => currentVideos.filter(video => video.id !== videoId));
      alert('Agendamento excluído com sucesso!');
    } catch (error) {
      alert('Erro ao excluir o agendamento: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    const getVideos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('scheduled_at', { ascending: true });

        if (error) throw error;
        if (data) setVideos(data);
      } catch (error) {
        alert('Erro ao buscar os vídeos: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    getVideos();
  }, [supabase]); // <--- A MUDANÇA É AQUI, ADICIONAMOS 'supabase'

  if (loading) {
    return <p>Carregando seus agendamentos...</p>;
  }
  
  if (videos.length === 0) {
    return <p>Você ainda não tem nenhum vídeo agendado.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Seus Agendamentos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
            <video className="w-full h-48 object-cover" controls preload="metadata">
              <source src={`${video.video_url}#t=0.1`} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
            <div className="p-4">
              <h4 className="font-bold text-lg truncate">{video.title || 'Vídeo sem título'}</h4>
              <p className="text-sm text-slate-600 mt-1">
                <strong>Agendado para:</strong><br/> 
                {new Date(video.scheduled_at).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <button 
                onClick={() => handleDelete(video.id)} 
                className="w-full mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}