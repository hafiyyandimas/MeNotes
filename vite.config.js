import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react-dom/') || id.includes('/node_modules/react/') || id.includes('/scheduler/')) return 'vendor-react';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/@dnd-kit/') || id.includes('/react-router')) return 'vendor-interaction';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          if (id.includes('/dexie/') || id.includes('/axios/')) return 'vendor-data';
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MeNotes',
        short_name: 'MeNotes',
        description: 'A calm space for your notes.',
        theme_color: '#0b1422',
        background_color: '#0b1422',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [],
      },
      devOptions: { enabled: false },
    }),
  ],
});
