import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
