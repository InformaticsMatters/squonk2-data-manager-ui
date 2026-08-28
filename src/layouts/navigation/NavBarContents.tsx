import { useState } from "react";

import { Box, Stack, Toolbar } from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { HeaderLogo } from "../../components/logo/HeaderLogo";
import { authClient } from "../../lib/auth-client";
import { MainNav, MainNavLink } from "./MainNavLink";
import { OrganisationIdentity } from "./OrganisationIdentity";
import { ProjectNavigation } from "./ProjectNavigation";

const UserMenu = dynamic(() => import("./UserMenu").then((module) => module.UserMenu), {
  ssr: false,
});

const applicationLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/datasets", label: "Datasets" },
  { href: "/administration", label: "Administration" },
] as const;

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/docs/concepts", label: "Documentation" },
] as const;

const NavigationLinks = ({ authenticated }: { authenticated: boolean }) => {
  const router = useRouter();
  const links = authenticated ? applicationLinks : publicLinks;

  return (
    <MainNav aria-label="Main">
      {links.map(({ href, label }) => {
        const familyPath = href.split("/").slice(0, 2).join("/") || "/";
        const active =
          familyPath === "/" ? router.pathname === "/" : router.asPath.startsWith(familyPath);
        return <MainNavLink active={active} href={href} key={href} label={label} />;
      })}
    </MainNav>
  );
};

const PublicNavigation = () => (
  <Toolbar sx={{ gap: 1 }}>
    <HeaderLogo />
    <Box sx={{ ml: "auto" }}>
      <NavigationLinks authenticated={false} />
    </Box>
    <UserMenu />
  </Toolbar>
);

const AuthenticatedNavigation = () => (
  <>
    <Toolbar>
      <Stack direction="row" sx={{ alignItems: "center", minWidth: 0 }}>
        <HeaderLogo />
        <OrganisationIdentity />
      </Stack>
      <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
        <NavigationLinks authenticated />
      </Box>
      <UserMenu />
    </Toolbar>
    <Box sx={{ display: { sm: "none" }, overflowX: "auto", px: 1 }}>
      <NavigationLinks authenticated />
    </Box>
  </>
);

/**
 * Whether the caller is signed in, holding its answer while the session is being re-read.
 *
 * The session store reports no session while it is checking, and it checks again whenever a new
 * reader subscribes — which a change of page policy does. The masthead is mounted once above all of
 * that, so without this it would flip to the signed-out shell and back mid-navigation: the flicker
 * this application no longer has anywhere else. Nothing is claimed before the first answer arrives,
 * so a caller who is not signed in still sees the public shell from the start.
 */
const useIsAuthenticated = () => {
  const { data: session, isPending } = authClient.useSession();
  // Held rather than derived: while the store is checking it reports no session, and the answer must
  // not fall back to "signed out" for those renders.
  const [authenticated, setAuthenticated] = useState(false);

  if (!isPending && authenticated !== !!session) {
    setAuthenticated(!!session);
  }

  return authenticated;
};

export const NavBarContents = () => {
  const authenticated = useIsAuthenticated();
  const router = useRouter();
  const usePublicShell = !authenticated || router.pathname.startsWith("/docs/");
  return usePublicShell ? (
    <PublicNavigation />
  ) : (
    <>
      <AuthenticatedNavigation />
      <ProjectNavigation />
    </>
  );
};
