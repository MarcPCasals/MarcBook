import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCanonicalCatalog } from './scripts/prepare-github-pages.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalFile = path.join(repositoryRoot, 'marcbook-catalog.json');
function canonicalCatalog() {
  let isBuild = false;
  return {
    name: 'marcbook-canonical-catalog',
    configResolved(config) { isBuild = config.command === 'build'; },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/marcbook-catalog.json') return next();
        try {
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.setHeader('Cache-Control', 'no-cache');
          response.end(readCanonicalCatalog(canonicalFile));
        } catch (error) {
          response.statusCode = 500;
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
    buildStart() {
      this.addWatchFile(canonicalFile);
      if (isBuild) this.emitFile({ type: 'asset', fileName: 'marcbook-catalog.json', source: readCanonicalCatalog(canonicalFile) });
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: "dist/client",
    assetsDir: 'marcbook-assets',
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: { allow: [repositoryRoot] },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), canonicalCatalog()],
});
