import { Button, styled } from "@mui/material";
import Link from "next/link";

/**
 * The application bar's own link styling, taken from the design this app shipped before the
 * redesign: white text on the primary bar, bold when active, and no underline indicator.
 *
 * It is deliberately separate from {@link NavigationTab}, which styles the two nav strips that sit
 * on ordinary page backgrounds — the project sections and the Administration tasks. The two
 * surfaces do not share a visual language, so they do not share a component.
 */
export const MainNavLink = ({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) => (
  <div>
    <Button
      component={Link}
      href={href}
      sx={{
        color: "white",
        fontWeight: active ? "bold" : "normal",
        textTransform: "none",
        ":hover": { bgcolor: "rgba(50, 0, 0, 0.04)" },
      }}
      variant="text"
    >
      {label}
    </Button>
  </div>
);

/**
 * Fixed-width centred slots, so bolding the active link never moves the links beside it.
 */
export const MainNav = styled("nav", { shouldForwardProp: (prop) => prop !== "linkWidth" })<{
  linkWidth?: number;
}>(({ linkWidth = 120, theme }) => ({
  display: "flex",
  alignItems: "center",

  "& div": {
    display: "inline-block",
    width: "100%",
    maxWidth: `${linkWidth}px`,
    textAlign: "center",
  },
  "& div:first-of-type": { marginLeft: theme.spacing(4) },
}));
