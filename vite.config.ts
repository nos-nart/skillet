import { defineConfig } from "npm:vite@6.1.0";
import react from "npm:@vitejs/plugin-react@4.3.4";
import tailwindcss from "npm:@tailwindcss/vite@4.0.6";

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
