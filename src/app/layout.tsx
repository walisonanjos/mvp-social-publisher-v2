// src/app/layout.tsx
import type { Metadata } from "next"; // MUDANÇA: Garante que o tipo Metadata esteja importado
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer"; // MUDANÇA: Importando nosso novo rodapé

// Mantivemos toda a sua configuração de fontes Geist original
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// MUDANÇA: Atualizamos o título e a descrição para refletir nosso app
export const metadata: Metadata = {
  title: "Social Publisher MVP",
  description: "Agende suas postagens de forma fácil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // MUDANÇA: Corrigido o idioma da página para 'pt-br'
    <html lang="pt-br">
      {/* Mantivemos a sua classe de corpo original com as fontes Geist */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer /> {/* MUDANÇA: Adicionamos o rodapé no final da página */}
      </body>
    </html>
  );
}