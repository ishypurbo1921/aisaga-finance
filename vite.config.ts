
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': process.env
  },
  server: {
    port: 5173
  }
});
