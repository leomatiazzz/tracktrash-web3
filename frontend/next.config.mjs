import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Informa ao Next.js que a raiz deste projeto é a pasta /frontend,
  // evitando o aviso de múltiplos lockfiles no monorepo (Hardhat + Next.js).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
