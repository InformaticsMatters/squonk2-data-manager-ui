import { Button } from "@mui/material";
import Link from "next/link";

/**
 * A link in one of the nav strips that sit on an ordinary page background — the project sections
 * and the Administration tasks. The application bar has its own styling in {@link MainNavLink}.
 */
export const NavigationTab = ({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) => (
  <Button
    color="inherit"
    component={Link}
    href={href}
    sx={{
      borderBottom: 3,
      borderBottomColor: active ? "primary.main" : "transparent",
      borderRadius: 0,
      flexShrink: 0,
      textTransform: "none",
    }}
  >
    {label}
  </Button>
);
