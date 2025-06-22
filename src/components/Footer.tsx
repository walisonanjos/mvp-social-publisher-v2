// src/components/Footer.tsx
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-700 mt-12 py-8">
      <div className="container mx-auto text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Social Publisher MVP. Todos os direitos reservados.</p>
        <div className="mt-4 flex justify-center gap-x-6">
          <Link href="/terms" className="hover:text-teal-400 transition-colors">
            Termos de Serviço
          </Link>
          <Link href="/privacy" className="hover:text-teal-400 transition-colors">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}