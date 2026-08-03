import { Button } from "@mui/material";
import Link from "next/link";

export const NavigationTab = ({
  active,
  href,
  label,
  primary = false,
}: {
  active: boolean;
  href: string;
  label: string;
  primary?: boolean;
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
      minHeight: primary ? 52 : undefined,
      px: primary ? { xs: 1.5, sm: 2 } : undefined,
      textTransform: "none",
    }}
  >
    {label}
  </Button>
);
