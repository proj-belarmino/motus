import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    allowedHosts: ["pasteldemiolos.xyz"]
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
});
