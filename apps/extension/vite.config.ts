import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        popup: "popup.html",
        background: "src/background.ts",
      },
      output: {
        // The MV3 manifest references the worker by a fixed path, so it must not
        // be hashed. Everything else keeps the default hashed asset names.
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
      },
    },
  },
});
