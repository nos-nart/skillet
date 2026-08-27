import { defineConfig } from "npm:vite@8.2.2";
import react from "npm:@vitejs/plugin-react@6.1.0";
import tailwindcss from "npm:@tailwindcss/vite@4.3.3";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
