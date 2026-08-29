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
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
      // ⚠️ DO NOT define 'window' or 'global' here - it causes errors!
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react-is': path.resolve(__dirname, 'node_modules/react-is'),
      },
      dedupe: ['react', 'react-dom', 'react-is'],
    },
    optimizeDeps: {
      include: ['recharts', 'react-is', 'react', 'react-dom', 'axios'],
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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
              warning.code === 'EVAL' ||
              warning.code === 'CIRCULAR_DEPENDENCY') {
            return;
          }
          warn(warning);
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});