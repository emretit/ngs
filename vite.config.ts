import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  // Remove console.log and debugger in production
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  optimizeDeps: {
    include: ['@react-pdf/renderer', 'buffer'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI Components - All Radix packages
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-avatar',
            '@radix-ui/react-progress',
            '@radix-ui/react-slider',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-separator',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-slot',
          ],
          
          // Data fetching
          'query-vendor': ['@tanstack/react-query'],
          
          // Charts
          'chart-vendor': ['recharts'],
          
          // PDF generation (heavy)
          'pdf-vendor': ['@react-pdf/renderer'],
          
          // Animation
          'motion-vendor': ['framer-motion'],
          
          // Maps (heavy)
          'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-markercluster'],
          
          // Excel export
          'excel-vendor': ['xlsx'],
          
          // Gantt charts (heavy)
          'gantt-vendor': ['gantt-task-react', 'wx-react-gantt'],
          
          // Drag and drop
          'dnd-vendor': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            '@hello-pangea/dnd',
            'react-beautiful-dnd',
          ],
          
          // Calendar components
          'calendar-vendor': [
            'react-big-calendar',
            'react-calendar',
            'react-day-picker',
          ],
          
          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Date utilities
          'date-vendor': ['date-fns'],
          
          // Flow/diagram
          'flow-vendor': ['@xyflow/react', 'dagre'],
          
          // i18n
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // Utilities
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'uuid', 'fuse.js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Improve build performance
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
  },
}));
