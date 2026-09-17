/**
 * PROTOTYPE ONLY — throwaway. Delete with the variants it switches between.
 *
 * A floating bar that cycles the current variant. Deliberately ugly so it reads as scaffold rather
 * than as part of the design being judged. Never rendered in a production build.
 *
 * The choice lives in session storage rather than the URL: pages that canonicalise their own route
 * (the project family) rebuild the query from scratch and would strip a `?variant=` param on every
 * navigation. `?variant=` is still honoured once on load, so a link to a variant works.
 */
import { useEffect } from "react";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { atom, useAtom } from "jotai";
import { useRouter } from "next/router";

const STORAGE_KEY = "prototype-variant";

const variantAtom = atom<string | undefined>(undefined);

const isEditable = (element: Element | null) =>
  element instanceof HTMLElement &&
  (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));

export interface PrototypeVariant {
  key: string;
  name: string;
}

/**
 * The current variant. Seeded from `?variant=` on first render, then from session storage, then the
 * first variant in the list.
 */
export const usePrototypeVariant = (variants: readonly PrototypeVariant[]) => {
  const { query, isReady } = useRouter();
  const [selected, setSelected] = useAtom(variantAtom);

  useEffect(() => {
    if (selected !== undefined || !isReady) {
      return;
    }
    const requested = Array.isArray(query.variant) ? query.variant[0] : query.variant;
    const seed = requested ?? sessionStorage.getItem(STORAGE_KEY) ?? variants[0].key;
    // Persisted here too, so a `?variant=` link survives the next canonicalising navigation.
    sessionStorage.setItem(STORAGE_KEY, seed);
    setSelected(seed);
  }, [isReady, query.variant, selected, setSelected, variants]);

  const select = (key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setSelected(key);
  };

  return { variant: variants.find(({ key }) => key === selected) ?? variants[0], select };
};

export const PrototypeSwitcher = ({ variants }: { variants: readonly PrototypeVariant[] }) => {
  const { variant, select } = usePrototypeVariant(variants);
  const index = variants.indexOf(variant);

  const cycle = (step: number) =>
    select(variants[(index + step + variants.length) % variants.length].key);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(document.activeElement) || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === "ArrowLeft") {
        cycle(-1);
      } else if (event.key === "ArrowRight") {
        cycle(1);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        borderRadius: 999,
        bgcolor: "#111",
        color: "#fff",
        boxShadow: 6,
        fontFamily: "monospace",
      }}
    >
      <IconButton aria-label="Previous variant" sx={{ color: "inherit" }} onClick={() => cycle(-1)}>
        <ChevronLeft />
      </IconButton>
      <Typography sx={{ whiteSpace: "nowrap" }} variant="body2">
        {variant.key} — {variant.name} ({index + 1}/{variants.length})
      </Typography>
      <IconButton aria-label="Next variant" sx={{ color: "inherit" }} onClick={() => cycle(1)}>
        <ChevronRight />
      </IconButton>
    </Box>
  );
};
