import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : (process.env.VITE_BASE_PATH || '/akashcrm/'),
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://187.127.155.161',
        changeOrigin: true,
        secure: false
      }
    }
  }
}));
