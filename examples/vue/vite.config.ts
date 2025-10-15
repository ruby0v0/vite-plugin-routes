import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Routes from 'vite-plugin-routes'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Routes(),
    Components({
      dts: 'src/types/components.d.ts',
    }),
  ],
})
