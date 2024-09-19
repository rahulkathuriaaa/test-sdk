import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: 'index' },
    rollupOptions: {
      external: ['tweetnacl-util', 'tweetnacl', 'axios'],
    },
  },
  resolve: { alias: { src: resolve('src/') } },
  plugins: [dts({})],
});
