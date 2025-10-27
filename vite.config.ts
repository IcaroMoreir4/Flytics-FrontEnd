import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// ✅ Configuração do Vite para React + Tailwind + integração local com backend
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // permite usar "@/components" etc.
    },
  },

  server: {
    port: 5173, // padrão do Vite — pode ajustar se precisar
    open: true, // abre o navegador automaticamente
    cors: true, // permite requisições externas (útil no dev)
    proxy: {
      // 🔹 Roteia chamadas de API para o backend local automaticamente
      '/api': {
        target: 'http://localhost:3000', // backend Express
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
