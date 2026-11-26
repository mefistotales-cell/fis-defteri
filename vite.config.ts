import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/fis-defteri/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'ornek-fis.png', 'ornek-fatura.png'],
      manifest: {
        name: 'Fiş Defteri — Haskara Tarım',
        short_name: 'Fiş Defteri',
        description: 'Yazar kasa fişi ve faturayı okuyup Luca ile Logo Excel dosyasına aktarır.',
        lang: 'tr',
        id: '/fis-defteri/',
        start_url: '/fis-defteri/',
        scope: '/fis-defteri/',
        display: 'standalone',
        background_color: '#f3efe6',
        theme_color: '#24301f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: { host: '0.0.0.0', port: 47321, strictPort: true },
  preview: { host: '0.0.0.0', port: 47321, strictPort: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
