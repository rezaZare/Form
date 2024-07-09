import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: ["src/index.ts"],
      name: "base",

      // Change this to the formats you want to support.
      // Don't forgot to update your package.json as well.
      formats: ["es"],
    },

    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
