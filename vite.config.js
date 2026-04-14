import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'pixelflux': resolve(__dirname, 'pixelflux.js'),
        'apotheosis': resolve(__dirname, 'addon/apotheosis.js')
      },
      formats: ['es'],
      fileName: (format, entryName) => {
        if (entryName === 'apotheosis') return `addon/${entryName}.js`;
        return `${entryName}.js`;
      }
    },
    rollupOptions: {
      external: ['three'],
      output: {
        paths: {
          three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
        }
      }
    },
    emptyOutDir: true
  }
});