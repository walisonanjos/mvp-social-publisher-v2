// src/components/UploadForm.tsx

'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';

type UploadFormProps = {
  onUploadSuccess: () => void;
};

const initialTargets = {
  instagram: false,
  facebook: false,
  youtube: false,
  tiktok: false,
  kwai: false,
};

const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [socialTargets, setSocialTargets] = useState(initialTargets);
  const [isLoading, setIsLoading] = useState(false);
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
  
  const handleUpload = async () => {
    if (!file || !scheduleDate || !scheduleTime) {
      alert('Por favor, selecione um arquivo, uma data e uma hora de agendamento.');
      return;
    }
    setIsLoading(true);

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

      alert('Sucesso! Seu vídeo foi agendado.');
      onUploadSuccess();

    } catch (error) {
      console.error('Erro no processo de agendamento:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('unique_user_schedule')) {
        alert('Erro: Você já possui um agendamento para este mesmo dia e horário.');
      } else {
        alert('Ocorreu um erro: ' + errorMessage);
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
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-6">
      
      <div>
        <label className="block text-sm font-medium text-slate-700">Vídeo</label>
        <div className="mt-1">
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange} 
            disabled={isLoading} 
            ref={fileInputRef}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Título</label>
        <input 
          id="title" 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrição</label>
        <textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={4}
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="scheduleDate" className="block text-sm font-medium text-slate-700">Data do Agendamento</label>
          <input 
            id="scheduleDate" 
            type="date" 
            value={scheduleDate} 
            onChange={(e) => setScheduleDate(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            // --- MUDANÇA PRINCIPAL AQUI ---
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
          />
        </div>
        <div>
          <label htmlFor="scheduleTime" className="block text-sm font-medium text-slate-700">Hora do Agendamento</label>
          <select 
            id="scheduleTime" 
            value={scheduleTime} 
            onChange={(e) => setScheduleTime(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm
              focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="" disabled>Selecione a hora</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700">Postar em:</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.keys(initialTargets).map(key => (
            <label key={key} className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                name={key} 
                checked={socialTargets[key as keyof typeof socialTargets]} 
                onChange={handleTargetChange}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={isLoading || !file}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
          disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Agendando...' : 'Agendar Post'}
      </button>
    </div>
  );
}