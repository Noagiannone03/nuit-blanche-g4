import { defineConfig } from 'vite';

// base './' : le build fonctionne aussi bien sur GitHub Pages que dans un sous-dossier
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 }, // Phaser pèse ~1,5 Mo, c'est normal
});
