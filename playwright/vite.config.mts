import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

// The app itself is built by Next with webpack; this server exists only to host the component
// gallery (`playwright/gallery/index.html`) for Playwright's `mount` fixture. It mirrors the two
// pieces of the Next build that component source depends on: the `@/*` alias and the Emotion JSX
// runtime (inferred from `tsconfig.json`'s `jsxImportSource`).
export default defineConfig({
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-gallery", import.meta.url)),
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  root: appRoot,
  server: { port: 3100, strictPort: true },
});
