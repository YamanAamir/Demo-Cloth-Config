import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteImagemin from 'vite-plugin-imagemin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  viteImagemin({
    gifsicle: { optimizationLevel: 7 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 75 },
    pngquant: { quality: [0.7, 0.9], speed: 4 },
    svgo: {},
    webp: { quality: 75 }
  })
  ],
  // base: '/Demo-Clothing-Configurator/'


})
