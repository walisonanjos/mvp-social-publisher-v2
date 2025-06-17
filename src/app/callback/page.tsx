// src/app/auth/callback/page.tsx

import { Suspense } from 'react';
import CallbackHandler from '../../../components/CallbackHandler';

// Componente simples para mostrar enquanto o CallbackHandler é carregado
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="p-8 bg-gray-800 rounded-lg text-center">
                <p>Carregando...</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
  return (
    // O Suspense Boundary resolve o erro de build do Next.js
    <Suspense fallback={<LoadingState />}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-8 bg-gray-800 rounded-lg text-center">
            <CallbackHandler />
        </div>
      </div>
    </Suspense>
  );
}