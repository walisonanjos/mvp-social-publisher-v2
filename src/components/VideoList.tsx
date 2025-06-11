// src/components/VideoList.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';

type Video = {
  id: number;
  created_at: string;
  video_url: string;
  user_id: string;
  scheduled_at: string; // Garantimos que scheduled_at está no tipo
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
          .order('scheduled_at', { ascending: true }); // Ordena pelos próximos agendamentos

        if (error) throw error;
        if (data) setVideos(data);
      } catch (error) {
        alert('Erro ao buscar os vídeos: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    getVideos();
  }, []);

  if (loading) {
    return <p>Carregando seus agendamentos...</p>;
  }
  
  if (videos.length === 0) {
    return <p>Você ainda não tem nenhum vídeo agendado.</p>;
  }

  return (
    <div>
      <h2>Seus Agendamentos</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {videos.map((video) => (
          <div key={video.id} style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
            <video width="320" height="240" controls preload="metadata">
              <source src={`${video.video_url}#t=0.1`} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
            <h4>{video.title || 'Vídeo sem título'}</h4>
            
            {/* --- MUDANÇA PRINCIPAL AQUI --- */}
            <p>
              <strong>Agendado para:</strong><br/> 
              {new Date(video.scheduled_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            
            <button 
              onClick={() => handleDelete(video.id)} 
              style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}