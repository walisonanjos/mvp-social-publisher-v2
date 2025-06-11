// src/components/Auth.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
    } catch (error) {
      alert('Erro ao cadastrar: ' + (error as Error).message);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O redirecionamento ou atualização da página acontecerá automaticamente
      // pela lógica que já temos no arquivo page.tsx
    } catch (error) {
      alert('Erro no login: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
      <h3>Acesse sua conta</h3>
      <p>Faça login ou crie sua conta para começar a enviar vídeos.</p>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={{ padding: '8px', width: '300px' }}
          />
        </div>
        <br />
        <div>
          <label htmlFor="password">Senha</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ padding: '8px', width: '300px' }}
          />
        </div>
        <br />
        <button type="submit" onClick={handleSignIn} style={{ padding: '10px' }}>
          Entrar
        </button>
        <button type="submit" onClick={handleSignUp} style={{ marginLeft: '10px', padding: '10px' }}>
          Cadastrar
        </button>
      </form>
    </div>
  );
}