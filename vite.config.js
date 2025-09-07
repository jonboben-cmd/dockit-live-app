import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This ensures the build environment supports modern JavaScript features
    // like import.meta.env, which are needed for secure environment variables.
    target: 'esnext'
  }
})

