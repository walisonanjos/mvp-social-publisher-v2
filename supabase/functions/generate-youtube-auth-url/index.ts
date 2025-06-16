// supabase/functions/generate-youtube-auth-url/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { google } from 'https://esm.sh/googleapis@122.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const REDIRECT_URI = 'https://mvp-social-publisher-v2.vercel.app/auth/callback';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('As credenciais do Google não foram encontradas nos segredos do projeto.');
    }

    // Cria um novo cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    // Define os "escopos" - as permissões que estamos pedindo ao usuário
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Gera a URL de autorização
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Pede um "refresh token" para manter o acesso
      scope: scopes,
      prompt: 'consent' // Garante que a tela de consentimento sempre apareça
    });

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})