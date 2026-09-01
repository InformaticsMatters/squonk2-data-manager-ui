// PROTOTYPE — throwaway. Floating variant switcher, dev-only.
import { useEffect } from "react";

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useRouter } from "next/router";

export const VARIANTS = [
  { key: "current", name: "Today — Popper" },
  { key: "list", name: "Menu rows" },
  { key: "columns", name: "Two columns" },
  { key: "sections", name: "Labelled sections" },
  { key: "status", name: "Status first" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

const STORAGE_KEY = "prototype-user-menu-variant";

const isVariantKey = (value: string | undefined): value is VariantKey =>
  VARIANTS.some((variant) => variant.key === value);

/**
 * The chosen variant sticks for the tab, so it survives navigating to a page whose link has no
 * `?userMenu=` on it — otherwise a variant could only ever be judged on the page it was picked on.
 */
export const usePrototypeVariant = (): VariantKey => {
  const { query } = useRouter();
  const requested = Array.isArray(query.userMenu) ? query.userMenu[0] : query.userMenu;

  if (isVariantKey(requested)) {
    sessionStorage.setItem(STORAGE_KEY, requested);
    return requested;
  }

  const remembered = sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  return isVariantKey(remembered) ? remembered : "current";
};

export const PrototypeSwitcher = () => {
  const router = useRouter();
  const current = usePrototypeVariant();
  const index = VARIANTS.findIndex((variant) => variant.key === current);

  const go = (delta: number) => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    void router.replace(
      { pathname: router.pathname, query: { ...router.query, userMenu: next.key } },
      undefined,
      { shallow: true },
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) {
        return;
      }
      if (event.key === "ArrowLeft") {
        go(-1);
      } else if (event.key === "ArrowRight") {
        go(1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 88,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 999,
        bgcolor: "#111",
        color: "#fff",
        border: "2px solid #ff00a8",
        boxShadow: 6,
        zIndex: 20_000,
        displayPrint: "none",
      }}
    >
      <IconButton color="inherit" size="small" onClick={() => go(-1)}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }} variant="body2">
        {current} — {VARIANTS[index]?.name}
      </Typography>
      <IconButton color="inherit" size="small" onClick={() => go(1)}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
};
