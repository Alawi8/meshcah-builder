import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: '../assets/dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: command === 'serve' ? 'index.html' : 'src/main.tsx',
      output: {
        entryFileNames: 'js/editor.js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'css/editor[extname]',
      },
    },
  },
}));
