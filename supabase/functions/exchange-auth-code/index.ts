// supabase/functions/exchange-auth-code/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    if (!code) throw new Error('Código de autorização não fornecido.')

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const REDIRECT_URI = 'https://mvp-social-publisher-v2.vercel.app/auth/callback';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Credenciais do Google não encontradas.')
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const tokenParams = new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    const responseBodyText = await tokenResponse.text();
    // MUDANÇA: Log de depuração para ver a resposta bruta do Google
    console.log('Resposta bruta do Google:', responseBodyText);

    const tokens = JSON.parse(responseBodyText);

    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !expiry_date) {
      throw new Error('Resposta do Google não continha os tokens necessários.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Usuário não autenticado para salvar tokens.');

    const tokenDataToUpsert = {
        user_id: user.id,
        access_token: access_token,
        expiry_date: new Date(Date.now() + (expiry_date * 1000)).toISOString(),
        ...(refresh_token && { refresh_token: refresh_token })
    };

    const { error: upsertError } = await supabaseClient
      .from('youtube_tokens')
      .upsert(tokenDataToUpsert);

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ message: 'Conta do YouTube conectada com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro em exchange-auth-code:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})