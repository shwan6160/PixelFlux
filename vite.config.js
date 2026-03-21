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
        globals: {
          three: 'THREE'
        }
      }
    },
    emptyOutDir: true
  }
});