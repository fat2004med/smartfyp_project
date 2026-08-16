import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(), 
      tailwindcss()
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode || 'production'),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'global': 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react-is': path.resolve(__dirname, 'node_modules/react-is'),
      },
      dedupe: ['react', 'react-dom', 'react-is'],
    },
    optimizeDeps: {
      include: ['recharts', 'react-is'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      chunkSizeWarningLimit: 2500,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router-dom') ||
                id.includes('react-is')
              ) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'vendor-ui';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              return 'vendor';
            }
          },
        },
        onwarn(warning, warn) {
          // Suppress non-critical warnings that could abort strict CI/CD builds
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.code === 'EVAL') {
            return;
          }
          warn(warning);
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

