import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: 'index' },
    rollupOptions: {
      external: ['@mizuwallet-sdk/core', '@aptos-labs/ts-sdk'],
    },
  },
  resolve: { alias: { src: resolve('src/') } },
  plugins: [dts({})],
});

