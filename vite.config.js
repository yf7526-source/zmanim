import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // These heavy libs are only used in the lazy-loaded MapPicker route.
    // Excluding them from dev pre-bundling avoids a very slow startup scan;
    // they are served on-demand when MapPicker is actually opened.
    exclude: ['three', 'react-globe.gl']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-tools';
          if (id.includes('react-globe.gl') || id.includes('/three/')) return 'globe-3d';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('@base44')) return 'base44';
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) return 'ui-vendor';
          if (id.includes('react') || id.includes('react-router')) return 'react-vendor';
        },
      },
    },
  },
});