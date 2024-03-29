import { Box } from "@mui/material";
import { useRouter } from "next/router";

import { NextLink } from "./NextLink";

const links = {
  "/docs/guided-tour": "Guided Tour",
  "/docs/how-to": "How To",
  "/docs/concepts": "Concepts guide",
};

type Routes = keyof typeof links;

export const DocsNav = () => {
  const router = useRouter();

  return (
    <Box aria-label="Docs" component="nav" display="flex" gap={2} role="navigation">
      {Object.entries(links).map(([href, title]) => (
        <NextLink
          component="button"
          disabled={router.pathname === href}
          href={{ pathname: href as Routes }}
          key={href}
        >
          {title}
        </NextLink>
      ))}
    </Box>
  );
};
