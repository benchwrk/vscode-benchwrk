import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path, { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/components": path.resolve(__dirname, "./src/components"),
      src: path.resolve(__dirname, "./src"),
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
    },
  },

  optimizeDeps: {
    entries: ["src/**/*.{js,ts,jsx,tsx}"],
  },
  build: {
    rollupOptions: {
      external: ["vscode", "react", "react-dom", "react/jsx-runtime"],
      input: {
        extension: "./src/extension.ts", // Main extension entry
        webview: "./src/webview/index.tsx", // Webview entry
      },
      output: {
        globals: {
          react: "React",
          "react-dom": "React-dom",
          "react/jsx-runtime": "react/jsx-runtime",
        },
        dir: "out",
        format: "es",
        inlineDynamicImports: false,
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "extension" ? "extension.js" : "webview.js";
        },
      },
    },
    sourcemap: true,
    outDir: "out",
    target: "node16",
  },
});
