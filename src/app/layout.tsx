import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { inicializarKnowledgeBase } from "@/lib/init-context";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Controle de Estoque",
  description: "Sistema de gestão de estoque, aquisições e pedidos.",
  keywords: ["Estoque", "Aquisições", "Pedidos", "Gestão", "React"],
  authors: [{ name: "Equipe de Desenvolvimento" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Sistema de Controle de Estoque",
    description: "Sistema de gestão de estoque, aquisições e pedidos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Controle de Estoque",
    description: "Sistema de gestão de estoque, aquisições e pedidos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inicializar a Knowledge Base no lado do servidor
  // Isso garante que o índice de busca esteja pronto antes do primeiro request
  // Usar import dinâmico com fallback para evitar erros durante hot reload
  import('@/lib/init-context').then(({ inicializarKnowledgeBase }) => {
    inicializarKnowledgeBase().catch(error => {
      console.error('❌ Erro fatal ao inicializar Knowledge Base:', error)
      // Em produção, poderíamos enviar um alerta ao usuário ou registrar em serviço externo
      // Por enquanto, apenas logamos o erro para diagnóstico
    })
  }).catch(error => {
    // Capturar erros de importação (pode ocorrer durante hot reload)
    console.warn('⚠️ Erro ao importar módulo de inicialização:', error)
  })

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
