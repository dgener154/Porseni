import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const cardSecurityPlugin = {
    name: 'api-card-printing-security',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url || '';
        if (
          url.startsWith('/api/kartu/') ||
          url.startsWith('/api/cetak') ||
          url.startsWith('/api/print-card') ||
          url.startsWith('/api/export-card')
        ) {
          const authRole = req.headers['x-user-role'] || req.headers['role'] || '';
          if (authRole === 'LEMBAGA' || authRole !== 'ADMIN') {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                message:
                  'Akses ditolak. Akun Pihak Lembaga hanya memiliki izin untuk melihat kartu peserta.',
                error:
                  'Akses ditolak. Akun Pihak Lembaga hanya memiliki izin untuk melihat kartu peserta.',
              })
            );
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              message: 'Operasi cetak diizinkan untuk Admin / Panitia Pusat.',
            })
          );
          return;
        }
        next();
      });
    },
  };

  return {
    plugins: [react(), tailwindcss(), cardSecurityPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
