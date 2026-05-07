import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./context/Web3Context";
import AppShell         from "./components/AppShell";

// [MELHORIA] next/font carrega Inter localmente — sem FOUC, sem request externo,
// com melhor Core Web Vitals vs raw <link> para Google Fonts.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "TrackTrash — Smart Reverse Logistics",
  description:
    "Protocolo Web3 de Logística Reversa sustentável com EcoToken, EcoBadge NFT, Staking e Governança DAO.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-[#0d1610] to-[#1a2b1e] font-sans text-slate-100 antialiased">
        {/* Web3Provider envolve toda a árvore — estado de carteira acessível em qualquer rota */}
        <Web3Provider>
          <AppShell>{children}</AppShell>
        </Web3Provider>
      </body>
    </html>
  );
}
