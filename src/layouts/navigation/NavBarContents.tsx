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
  { href: "/projects", label: "Project" },
  { href: "/datasets", label: "Datasets" },
  { href: "/administration/organisation-access", label: "Administration" },
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

export const NavBarContents = () => {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const usePublicShell = !session || router.pathname.startsWith("/docs/");
  return usePublicShell ? (
    <PublicNavigation />
  ) : (
    <>
      <AuthenticatedNavigation />
      <ProjectNavigation />
    </>
  );
};
