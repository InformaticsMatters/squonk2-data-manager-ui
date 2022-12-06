import { Button } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";

const links = {
  "/docs/guided-tour": "Guided Tour",
  "/docs/how-to": "How To",
  "/docs/concepts": "Concepts guide",
};

type Routes = keyof typeof links;

export const DocsNav = () => {
  const router = useRouter();

  return (
    <nav aria-label="Docs" role="navigation">
      {Object.entries(links).map(([href, title]) => (
        <NextLink legacyBehavior passHref href={{ pathname: href as Routes }} key={href}>
          <Button disabled={router.pathname === href}>{title}</Button>
        </NextLink>
      ))}
    </nav>
  );
};
