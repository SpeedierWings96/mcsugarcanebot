import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'public'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist-gui'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
