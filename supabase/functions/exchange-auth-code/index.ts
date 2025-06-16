// supabase/functions/exchange-auth-code/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { google } from 'https://esm.sh/googleapis@122.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pega o código de autorização do corpo da requisição
    const { code } = await req.json()
    if (!code) {
      throw new Error('Código de autorização não fornecido.')
    }

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const REDIRECT_URI = 'https://mvp-social-publisher-v2.vercel.app/auth/callback';

    // Cria um cliente OAuth2 com as credenciais
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    // Troca o código pelos tokens de acesso e refresh
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !refresh_token || !expiry_date) {
      throw new Error('Não foi possível obter os tokens de acesso do Google.');
    }

    // Cria um cliente Supabase para interagir com o banco de dados
    // usando a chave de autorização do usuário que fez a chamada.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Pega o usuário logado a partir do token da requisição
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Usuário não encontrado.');

    // Salva os tokens na nova tabela, associados ao usuário
    const { error: upsertError } = await supabaseClient
      .from('youtube_tokens')
      .upsert({
        user_id: user.id,
        access_token: access_token,
        refresh_token: refresh_token,
        expiry_date: new Date(expiry_date).toISOString(),
      });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ message: 'Conta do YouTube conectada com sucesso!' }), {
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