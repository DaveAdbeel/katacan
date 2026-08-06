import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: el sitio se sirve en https://daveadbeel.github.io/katacan/
export default defineConfig({
  base: '/katacan/',
  plugins: [react(), tailwindcss()],
})
