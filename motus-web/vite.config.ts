import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ''),
    ...loadEnv(mode, '../', ''),
  };

  const frontendPort = parseInt(env.VITE_PORT || env.PORT || '5173', 10);
  const backendPort = env.BACKEND_PORT || env.SERVER_PORT || '8080';
  const backendUrl = env.BACKEND_URL || `http://localhost:${backendPort}`;
  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : ['pasteldemiolos.xyz', 'localhost'];

  return {
    server: {
      port: frontendPort,
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
  };
});
