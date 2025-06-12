// src/components/VideoList.tsx

import React from 'react';

// Definindo a tipagem para cada objeto de vídeo
interface Video {
  id: string;
  title: string;
  video_url: string;
  scheduled_at: string; // A data vem como string do Supabase
}

// Definindo a tipagem para as props do componente
interface VideoListProps {
  videos: Video[];
}

const VideoList: React.FC<VideoListProps> = ({ videos }) => {
  // Função para formatar a data para um padrão brasileiro amigável
  const formatScheduleDate = (dateString: string) => {
    if (!dateString) return 'Data não definida';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  };

  if (videos.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-gray-700 bg-gray-800/50 p-12 text-center">
        <h3 className="text-lg font-medium text-white">Nenhum agendamento por aqui</h3>
        <p className="mt-2 text-sm text-gray-400">
          Use o formulário acima para agendar sua primeira postagem.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-white mb-6">
        Meus Agendamentos
      </h2>
      
      {/* Container da grade de vídeos */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        {/* Mapeando cada vídeo para um card */}
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-teal-500/20"
          >
            {/* Placeholder para a Thumbnail do Vídeo */}
            <div className="aspect-w-9 aspect-h-16 bg-gray-700 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.55a1 1 0 011.45.89V16.1a1 1 0 01-1.45.89L15 14M5 9v6a2 2 0 002 2h4a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            
            {/* Conteúdo do Card (Título e Data) */}
            <div className="flex flex-1 flex-col space-y-2 p-4">
              <h3 className="text-base font-medium text-white">
                {video.title}
              </h3>
              <div className="flex flex-1 flex-col justify-end">
                <p className="text-sm text-gray-400">
                  Agendado para:
                </p>
                <p className="text-sm font-semibold text-teal-400">
                  {formatScheduleDate(video.scheduled_at)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;