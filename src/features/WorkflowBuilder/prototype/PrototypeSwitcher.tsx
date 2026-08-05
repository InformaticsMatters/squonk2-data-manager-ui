/** PROTOTYPE — THROWAWAY CODE. Hidden in production builds. */

import { useEffect } from "react";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

export interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[];
  current: string;
  onChange: (key: string) => void;
}

export const PrototypeSwitcher = ({ variants, current, onChange }: PrototypeSwitcherProps) => {
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      const tag = element?.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || element?.isContentEditable === true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target) || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
        return;
      }
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      const next = variants[(index + delta + variants.length) % variants.length];
      onChange(next.key);
    };

    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [index, variants, onChange]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cycle = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    onChange(next.key);
  };

  return (
    <Box
      sx={{
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 999,
        bottom: 20,
        boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
        color: "#fff",
        display: "flex",
        gap: 0.5,
        left: "50%",
        paddingX: 0.5,
        position: "fixed",
        transform: "translateX(-50%)",
        zIndex: 1400,
      }}
    >
      <IconButton size="small" sx={{ color: "inherit" }} onClick={() => cycle(-1)}>
        <ChevronLeft />
      </IconButton>
      <Typography sx={{ minWidth: 260, textAlign: "center" }} variant="body2">
        <strong>{variants[index]?.key}</strong> — {variants[index]?.name}
      </Typography>
      <IconButton size="small" sx={{ color: "inherit" }} onClick={() => cycle(1)}>
        <ChevronRight />
      </IconButton>
    </Box>
  );
};
