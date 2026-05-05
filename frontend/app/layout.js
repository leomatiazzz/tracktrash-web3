import "./globals.css";
import { Web3Provider } from "./context/Web3Context";
import AppShell         from "./components/AppShell";

export const metadata = {
  title: "TrackTrash — Smart Reverse Logistics",
  description:
    "Protocolo Web3 de Logística Reversa sustentável com EcoToken, EcoBadge NFT, Staking e Governança DAO.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-gradient-to-br from-[#0d1610] to-[#1a2b1e] text-slate-100"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0d1610 0%, #1a2b1e 100%)",
          color: "#f1f5f9",
          margin: 0,
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* Web3Provider envolve toda a árvore — estado de carteira acessível em qualquer rota */}
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
