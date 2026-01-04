import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    // Ignorar erros de TypeScript durante o build (o Vite já faz type-checking)
    rollupOptions: {
      onwarn(warning, warn) {
        // Suprimir avisos de TypeScript sobre arquivos do servidor
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.id?.includes('server/')) {
          return
        }
        warn(warning)
      }
    }
  }
})
