// src/components/VideoList.tsx

import React, { useState, useEffect } from 'react'; // MUDANÇA: 'useMemo' foi removido daqui
import { Video } from '../app/page';
import { Instagram, Facebook, Youtube, MessageSquare, Waypoints, ChevronDown } from 'lucide-react';

interface VideoListProps {
  groupedVideos: { [key: string]: Video[] };
  onDelete: (videoId: string) => void;
}

const SocialIcon = ({ platform }: { platform: string }) => {
  // ... (código dos ícones permanece igual) ...
  switch (platform) {
    case 'instagram':
      return <Instagram size={16} className="text-pink-500" />;
    case 'facebook':
      return <Facebook size={16} className="text-blue-600" />;
    case 'youtube':
      return <Youtube size={16} className="text-red-600" />;
    case 'tiktok':
      return <MessageSquare size={16} className="text-cyan-400" />;
    case 'kwai':
      return <Waypoints size={16} className="text-orange-500" />;
    default:
      return null;
  }
};

const VideoList: React.FC<VideoListProps> = ({ groupedVideos, onDelete }) => {
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(date);
  };

  const formatDateKeyForTitle = (dateKey: string) => {
    const date = new Date(dateKey + 'T12:00:00');
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date);
  };
  
  const sortedDateKeys = Object.keys(groupedVideos).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  useEffect(() => {
    if (sortedDateKeys.length > 0) {
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      
      let defaultOpenKey = sortedDateKeys[0]; 
      
      if (groupedVideos[todayKey]) {
        defaultOpenKey = todayKey;
      }
      
      // Apenas define o estado se ele ainda não foi definido para evitar re-renderizações desnecessárias
      setOpenDates(prev => {
        if (prev[defaultOpenKey]) return prev;
        return { ...prev, [defaultOpenKey]: true };
      });
    }
  }, [sortedDateKeys, groupedVideos]);


  const toggleDateGroup = (date: string) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (sortedDateKeys.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-gray-700 bg-gray-800/50 p-12 text-center">
        <h3 className="text-lg font-medium text-white">Nenhum agendamento por aqui</h3>
        <p className="mt-2 text-sm text-gray-400">Use o formulário acima para agendar sua primeira postagem.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-white mb-6">
        Meus Agendamentos
      </h2>
      {sortedDateKeys.map(dateKey => {
        const isOpen = openDates[dateKey] || false;
        
        return (
          <div key={dateKey} className="bg-gray-800/50 rounded-lg border border-gray-700/50">
            <button
              onClick={() => toggleDateGroup(dateKey)}
              className="flex justify-between items-center w-full p-4 text-left"
            >
              <h3 className="text-lg font-semibold text-teal-400 capitalize">
                {formatDateKey(dateKey)}
              </h3>
              <ChevronDown
                size={20}
                className={`text-teal-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            
            {isOpen && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedVideos[dateKey].map((video) => (
                    <div
                      key={video.id}
                      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg"
                    >
                      <button onClick={() => onDelete(video.id)} className="absolute top-2 right-2 z-10 p-1.5 bg-red-600/50 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Excluir agendamento">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div className="aspect-w-9 aspect-h-16 bg-gray-700 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-600">{formatTime(video.scheduled_at)}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-base font-medium text-white flex-1 pr-2">{video.title}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${video.is_posted ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                            {video.is_posted ? 'Postado' : 'Postado'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          {video.target_instagram && <SocialIcon platform="instagram" />}
                          {video.target_facebook && <SocialIcon platform="facebook" />}
                          {video.target_youtube && <SocialIcon platform="youtube" />}
                          {video.target_tiktok && <SocialIcon platform="tiktok" />}
                          {video.target_kwai && <SocialIcon platform="kwai" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
};

export default VideoList;