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

    // 1. Busca UM agendamento que já passou da hora e não foi postado
    const now = new Date().toISOString()
    const { data: video, error: selectError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .lt('scheduled_at', now)
      .eq('is_posted', false)
      .limit(1)
      .single() // Pega apenas um registro

    if (selectError) {
      // Se o erro for 'PGRST116', significa "nenhum registro encontrado", o que é normal.
      if (selectError.code === 'PGRST116') {
        console.log('Nenhum agendamento pendente encontrado para processar.');
        return new Response(JSON.stringify({ message: 'Nenhum agendamento pendente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw selectError
    }

    if (!video) {
         console.log('Nenhum vídeo retornado pela consulta.');
         return new Response(JSON.stringify({ message: 'Nenhum agendamento pendente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processando vídeo ID: ${video.id} para o usuário ${video.user_id}`);

    // 2. Busca os tokens de acesso do YouTube para este usuário
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('youtube_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', video.user_id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error(`Tokens do YouTube não encontrados para o usuário: ${video.user_id}`);
    }

    // 3. Configura o cliente OAuth2 do Google
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

    // 4. Faz o download do vídeo do Cloudinary
    console.log(`Baixando vídeo de: ${video.video_url}`);
    const videoResponse = await fetch(video.video_url);
    if (!videoResponse.ok) {
      throw new Error('Não foi possível baixar o vídeo do Cloudinary.');
    }
    const videoStream = videoResponse.body;

    // 5. Faz o upload para o YouTube
    console.log(`Iniciando upload para o YouTube para o vídeo: "${video.title}"`);
    const youtubeResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: video.title,
          description: video.description,
        },
        status: {
          privacyStatus: 'private', // ou 'public', 'unlisted'
        },
      },
      media: {
        body: videoStream,
      },
    });

    console.log(`Upload para o YouTube bem-sucedido! ID do vídeo no YouTube: ${youtubeResponse.data.id}`);

    // 6. Se tudo deu certo, atualiza nosso banco de dados
    const { error: updateError } = await supabaseAdmin
      .from('videos')
      .update({ is_posted: true })
      .eq('id', video.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Agendamento ID: ${video.id} marcado como 'postado'.`);

    return new Response(
      JSON.stringify({ message: `Vídeo "${video.title}" postado com sucesso no YouTube!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na execução da função post-scheduler:', error);
    // Opcional: Futuramente, poderíamos atualizar o status do vídeo para 'falhou' aqui.
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})