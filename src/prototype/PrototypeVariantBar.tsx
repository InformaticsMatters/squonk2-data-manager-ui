/**
 * PROTOTYPE — throwaway. Delete with the variants it switches between.
 *
 * A floating bar that flips the page between UI variants. The chosen variant lives in the URL
 * *hash* (`#variant=B`) rather than in a search param, because the Projects family's route contract
 * canonicalises the search string and would replace an unknown `?variant=` straight back out of the
 * URL. The hash is invisible to that contract, so it survives a reload and can still be pasted to
 * someone else.
 */
import { useCallback, useEffect, useState } from "react";

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box, IconButton, Portal, Typography } from "@mui/material";

export interface PrototypeVariant {
  key: string;
  name: string;
}

/** Only ever called after mount, so the location is always there to read. */
const readVariantFromHash = (keys: readonly string[], fallback: string) => {
  const value = new URLSearchParams(globalThis.location.hash.replace(/^#/u, "")).get("variant");
  return value !== null && keys.includes(value) ? value : fallback;
};

export const usePrototypeVariant = (variants: readonly PrototypeVariant[]) => {
  const keys = variants.map((variant) => variant.key);
  const fallback = keys[0];
  // The first render must match the server's, so the hash is read after mount rather than during it.
  const [variant, setVariant] = useState(fallback);
  const signature = keys.join(",");

  useEffect(() => {
    const sync = () =>
      setVariant(readVariantFromHash(signature.split(","), signature.split(",")[0]));
    sync();
    globalThis.addEventListener("hashchange", sync);
    return () => globalThis.removeEventListener("hashchange", sync);
  }, [signature]);

  const select = useCallback((next: string) => {
    const url = new URL(globalThis.location.href);
    url.hash = `variant=${next}`;
    globalThis.history.replaceState(globalThis.history.state, "", url.toString());
    setVariant(next);
  }, []);

  return { select, variant };
};

export interface PrototypeVariantBarProps {
  current: string;
  variants: readonly PrototypeVariant[];
  onSelect: (variant: string) => void;
}

/** Bottom-centre pill: previous, the current variant's name, next. Arrow keys cycle too. */
export const PrototypeVariantBar = ({ current, onSelect, variants }: PrototypeVariantBarProps) => {
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  );

  const step = useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length];
      onSelect(next.key);
    },
    [index, onSelect, variants],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        step(-1);
      } else if (event.key === "ArrowRight") {
        step(1);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [step]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  // Portalled to the body: the bar is mounted inside the header, and the layout's header and
  // footer are flex items carrying `z-index: 1`, so a fixed bar left inside the header paints
  // underneath the footer however high its own z-index is.
  return (
    <Portal>
      <Box
        sx={{
          alignItems: "center",
          backgroundColor: "#111",
          borderRadius: 999,
          bottom: 16,
          boxShadow: 8,
          color: "#fff",
          display: "flex",
          gap: 0.5,
          left: "50%",
          position: "fixed",
          px: 1,
          py: 0.5,
          transform: "translateX(-50%)",
          zIndex: 2000,
        }}
      >
        <IconButton size="small" sx={{ color: "inherit" }} onClick={() => step(-1)}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ minWidth: 220, textAlign: "center" }} variant="body2">
          {variants[index].key} — {variants[index].name}
        </Typography>
        <IconButton size="small" sx={{ color: "inherit" }} onClick={() => step(1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Portal>
  );
};
