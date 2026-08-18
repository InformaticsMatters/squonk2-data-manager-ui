/**
 * PROTOTYPE — THROWAWAY. Not production code, no tests, no error handling.
 *
 * Three variants of the Results page chrome (heading, filters, search, refresh, event-debug toggle,
 * definition chip) plus the list treatment under it, switchable on the existing
 * `/projects/[projectId]/results` route. Delete this folder once a design has won.
 *
 * The route family canonicalises its URL and drops query keys it does not own, so `?variant=` is
 * read once on arrival and then held in localStorage rather than in the URL. A link with
 * `?variant=B` still opens on that variant; the arrows and the arrow keys change it afterwards.
 */
import { useEffect } from "react";

import {
  ChevronLeftRounded as ChevronLeftRoundedIcon,
  ChevronRightRounded as ChevronRightRoundedIcon,
} from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const prototypeVariants = ["0", "A", "B", "C", "D"] as const;

export type PrototypeVariant = (typeof prototypeVariants)[number];

export const prototypeVariantNames: Record<PrototypeVariant, string> = {
  "0": "Today (unchanged)",
  A: "Command bar",
  B: "Filter rail",
  C: "Search first",
  D: "Filter rail — as specced (#1965)",
};

const isVariant = (value: unknown): value is PrototypeVariant =>
  typeof value === "string" && (prototypeVariants as readonly string[]).includes(value);

const variantAtom = atomWithStorage<PrototypeVariant>("PROTOTYPE_results_variant", "0");

/**
 * The variant a link named, read as this module loads — the route boundary rewrites the URL to its
 * canonical form before the page's own effects run, so by then the key is already gone.
 */
const browserLocation = globalThis.location as Location | undefined;

const linkedVariant = browserLocation
  ? new URLSearchParams(browserLocation.search).get("variant")
  : null;

/** The variant in play, seeded from `?variant=` the first time a link carrying one is opened. */
export const usePrototypeVariant = () => {
  const [variant, setVariant] = useAtom(variantAtom);

  useEffect(() => {
    if (isVariant(linkedVariant)) {
      setVariant(linkedVariant);
    }
    // Only on arrival: afterwards the switcher owns the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [variant, setVariant] as const;
};

/**
 * Floating bar that cycles the variant. Deliberately ugly and obviously not part of the design
 * being judged. Never rendered in a production build.
 */
export const PrototypeSwitcher = ({
  variant,
  onChange,
}: {
  onChange: (variant: PrototypeVariant) => void;
  variant: PrototypeVariant;
}) => {
  const go = (step: number) => {
    const index = prototypeVariants.indexOf(variant);
    onChange(
      prototypeVariants[(index + step + prototypeVariants.length) % prototypeVariants.length],
    );
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        go(-1);
      }
      if (event.key === "ArrowRight") {
        go(1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Paper
      elevation={8}
      sx={{
        alignItems: "center",
        bgcolor: "#111",
        borderRadius: 99,
        bottom: 16,
        color: "#fff",
        display: "flex",
        gap: 1,
        left: "50%",
        position: "fixed",
        px: 1,
        py: 0.5,
        transform: "translateX(-50%)",
        zIndex: 1300,
      }}
    >
      <IconButton size="small" sx={{ color: "inherit" }} onClick={() => go(-1)}>
        <ChevronLeftRoundedIcon />
      </IconButton>
      <Box sx={{ minWidth: 260, textAlign: "center" }}>
        <Typography sx={{ fontFamily: "monospace" }} variant="body2">
          {variant} — {prototypeVariantNames[variant]}
        </Typography>
      </Box>
      <IconButton size="small" sx={{ color: "inherit" }} onClick={() => go(1)}>
        <ChevronRightRoundedIcon />
      </IconButton>
    </Paper>
  );
};
