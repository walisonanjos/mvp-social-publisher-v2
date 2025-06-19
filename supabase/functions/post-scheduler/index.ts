// supabase/functions/post-scheduler/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { google } from 'https://esm.sh/googleapis@122.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date().toISOString()
    const { data: video, error: selectError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .lt('scheduled_at', now)
      .eq('is_posted', false)
      .limit(1)
      .single()

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        return new Response(JSON.stringify({ message: 'Nenhum agendamento pendente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw selectError
    }

    if (!video) {
         return new Response(JSON.stringify({ message: 'Nenhum agendamento pendente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processando vídeo ID: ${video.id}`);

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('youtube_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', video.user_id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error(`Tokens do YouTube não encontrados para o usuário: ${video.user_id}`);
    }

    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET')
    );
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    console.log(`Baixando vídeo de: ${video.video_url}`);
    const videoResponse = await fetch(video.video_url);
    if (!videoResponse.ok) throw new Error('Não foi possível baixar o vídeo do Cloudinary.');

    const videoStream = videoResponse.body;

    console.log(`Iniciando upload para o YouTube para o vídeo: "${video.title}"`);
    const youtubeResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: video.title,
          description: video.description,
        },
        status: {
          privacyStatus: 'private',
        },
      },
      media: {
        body: videoStream,
      },
    });

    const uploadedVideoId = youtubeResponse.data.id;
    if (!uploadedVideoId) {
      throw new Error("API do YouTube retornou sucesso, mas sem um ID de vídeo.");
    }

    console.log(`Upload para o YouTube bem-sucedido! ID do vídeo no YouTube: ${uploadedVideoId}`);

    // MUDANÇA: Atualizando o status E salvando o ID do vídeo do YouTube
    const { error: updateError } = await supabaseAdmin
      .from('videos')
      .update({ 
        is_posted: true,
        youtube_video_id: uploadedVideoId 
      })
      .eq('id', video.id);

    if (updateError) throw updateError;

    console.log(`Agendamento ID: ${video.id} marcado como 'postado' com o ID do YouTube: ${uploadedVideoId}.`);

    return new Response(
      JSON.stringify({ message: `Vídeo "${video.title}" postado com sucesso! ID no YouTube: ${uploadedVideoId}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na execução da função post-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})