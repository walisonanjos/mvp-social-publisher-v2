// src/components/UploadForm.tsx

'use client';

import { useState, useRef } from 'react';
import { createClient } from '../lib/supabaseClient';

// MUDANÇA 1: A linha abaixo foi completamente REMOVIDA
// type UploadFormProps = {}; 

const initialTargets = {
  instagram: false,
  facebook: false,
  youtube: false,
  tiktok: false,
  kwai: false,
};

const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];

// MUDANÇA 2: Removidos os parâmetros da função, pois não há props
export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [socialTargets, setSocialTargets] = useState(initialTargets);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const UPLOAD_PRESET = 'zupltfoo';
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSocialTargets(prevTargets => ({ ...prevTargets, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !scheduleDate || !scheduleTime || !title.trim()) {
      alert('Por favor, preencha o título e selecione um arquivo, uma data e uma hora.');
      return;
    }
    setIsLoading(true);
    setMessage('');

    const scheduled_at = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const cloudinaryResponse = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
      const cloudinaryData = await cloudinaryResponse.json();
      const videoUrl = cloudinaryData.secure_url;
      if (!videoUrl) throw new Error('Falha no upload para o Cloudinary.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error: supabaseError } = await supabase
        .from('videos')
        .insert([{ 
          video_url: videoUrl, 
          user_id: user.id,
          title: title,
          description: description,
          scheduled_at: scheduled_at,
          target_instagram: socialTargets.instagram,
          target_facebook: socialTargets.facebook,
          target_youtube: socialTargets.youtube,
          target_tiktok: socialTargets.tiktok,
          target_kwai: socialTargets.kwai,
        }]);
      if (supabaseError) throw supabaseError;

      setMessage('Sucesso! Seu vídeo foi agendado e aparecerá na lista.');

    } catch (error) {
      console.error('Erro no processo de agendamento:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('unique_user_schedule')) {
          setMessage('Erro: Você já possui um agendamento para este mesmo dia e horário.');
      } else {
          setMessage('Ocorreu um erro: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
      setFile(null);
      setTitle('');
      setDescription('');
      setScheduleDate('');
      setScheduleTime('');
      setSocialTargets(initialTargets);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 space-y-6">
      
      <div>
        <label className="block text-sm font-medium text-gray-300">Vídeo</label>
        <div className="mt-1">
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange} 
            disabled={isLoading} 
            ref={fileInputRef}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-600/20 file:text-teal-300 hover:file:bg-teal-600/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título</label>
        <input 
          id="title" 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descrição</label>
        <textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={3}
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-300">Data do Agendamento</label>
          <input 
            id="scheduleDate" 
            type="date" 
            value={scheduleDate} 
            onChange={(e) => setScheduleDate(e.target.value)} 
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-300">Hora do Agendamento</label>
          <select 
            id="scheduleTime" 
            value={scheduleTime} 
            onChange={(e) => setScheduleTime(e.target.value)} 
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            <option value="" disabled>Selecione a hora</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300">Postar em:</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.keys(initialTargets).map(key => (
            <label key={key} className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                name={key} 
                checked={socialTargets[key as keyof typeof socialTargets]} 
                onChange={handleTargetChange}
                  className="h-4 w-4 rounded border-gray-500 text-teal-600 focus:ring-teal-500 bg-gray-700"
              />
              <span className="text-sm text-gray-300">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>
      
      <button 
        type="submit"
        disabled={isLoading || !file}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Agendando...' : 'Agendar Post'}
      </button>
      {message && <p className='text-center text-sm mt-4 text-gray-400'>{message}</p>}
    </form>
  );
}