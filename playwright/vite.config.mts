import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

// The app itself is built by Next with webpack; this server exists only to host the component
// gallery (`playwright/gallery/index.html`) for Playwright's `mount` fixture. It mirrors the three
// pieces of the Next build that component source depends on: the `@/*` alias, the Emotion JSX
// runtime (inferred from `tsconfig.json`'s `jsxImportSource`), and the `process.env` that Next's
// own client modules — `next/link`, reached by any component that renders an internal link — read
// as they are evaluated. Webpack supplies that; a bare browser does not.
export default defineConfig({
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-gallery", import.meta.url)),
  define: { "process.env": "{}", "process.env.NODE_ENV": '"development"' },
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  root: appRoot,
  server: { port: 3100, strictPort: true },
});
