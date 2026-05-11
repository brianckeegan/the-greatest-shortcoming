import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: false,
  build: {
    outDir: path.join(__dirname, 'assets/css/dist'),
    emptyOutDir: true,
    assetsDir: '',
    rollupOptions: {
      input: path.join(__dirname, 'assets/css/src/entry.js'),
      output: {
        entryFileNames: 'main.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'main.css';
          return '[name][extname]';
        },
      },
    },
  },
});
