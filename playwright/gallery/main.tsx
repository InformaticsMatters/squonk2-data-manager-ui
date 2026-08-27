/* eslint-disable unicorn/prefer-global-this -- Playwright's gallery contract names `window.mount`
   and `window.unmount`; the fixture looks them up on `window` from the page context. */
/// <reference types="vite/client" />
import { type ComponentType } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

declare global {
  interface Window {
    mount: (parameters: { story: string; props?: Record<string, unknown> }) => Promise<void>;
    unmount: () => Promise<void>;
  }
}

// Story discovery has to stay inline: Vite analyses this glob statically, relative to this file.
// Next's own `ImportMeta.glob` (Turbopack) overloads merge with Vite's and drop the type parameter,
// so the module shape is asserted here instead of passed as a generic argument.
const stories = import.meta.glob("../../src/**/*.story.{tsx,jsx}") as Record<
  string,
  () => Promise<Record<string, unknown>>
>;

const idOf = (file: string) => file.replace(/^(?:\.\.\/)+src\//u, "").replace(/\.story\.\w+$/u, "");

const resolve = async (storyId: string) => {
  const separator = storyId.lastIndexOf("/");
  const path = storyId.slice(0, separator);
  const name = storyId.slice(separator + 1);
  const file = Object.keys(stories).find((f) => idOf(f) === path || idOf(f).endsWith(`/${path}`));
  if (file === undefined) {
    return undefined;
  }
  const exports = await stories[file]();
  return (exports[name] ?? exports.default) as ComponentType<Record<string, unknown>> | undefined;
};

const container = document.querySelector("#root");
if (!container) {
  throw new Error("Gallery root element is missing");
}

let root: Root | undefined;

const index = document.querySelector("#index");

// Convenience for eyeballing the gallery by hand (`pnpm test:gallery`); Playwright never uses it.
const renderIndex = async () => {
  if (!index) {
    return;
  }
  const entries = await Promise.all(
    Object.entries(stories).map(async ([file, load]) =>
      Object.keys(await load()).map((name) => `${idOf(file)}/${name}`),
    ),
  );
  index.replaceChildren(
    ...entries.flat().map((storyId) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `?story=${encodeURIComponent(storyId)}`;
      link.textContent = storyId;
      item.append(link);
      return item;
    }),
  );
};

// `window.mount` is the browser-side setup hook. Providers belong in the stories themselves (see
// `src/stories/decorators.tsx`) so each story states its own scenario; this function only resolves
// and renders. The app does not enable React StrictMode (see `next.config.mjs`), so neither does
// the gallery.
window.mount = async ({ story, props }) => {
  const Story = await resolve(story);
  if (!Story) {
    throw new Error(`Unknown story: ${story}`);
  }
  index?.replaceChildren();
  // Reuse the root so `update()` reconciles and component state survives a prop change.
  root ??= createRoot(container);
  // flushSync so a render error rejects this promise instead of being swallowed.
  flushSync(() => root?.render(<Story {...props} />));
};

window.unmount = () => {
  root?.unmount();
  root = undefined;
  return Promise.resolve();
};

const requested = new URLSearchParams(globalThis.location.search).get("story");
if (requested === null) {
  void renderIndex();
} else {
  void window.mount({ story: requested });
}
