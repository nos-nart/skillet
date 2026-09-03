import { defineConfig } from "npm:vite@8.2.2";
import react from "npm:@vitejs/plugin-react@6.1.0";
import stylex from "npm:@stylexjs/unplugin@0.19.0";

export default defineConfig({
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    react({ compiler: true }),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
