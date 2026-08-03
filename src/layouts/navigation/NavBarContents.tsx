import { Box, Divider, Stack, Toolbar } from "@mui/material";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import { HeaderLogo } from "../../components/logo/HeaderLogo";
import { authClient } from "../../lib/auth-client";
import { NavigationTab } from "./NavigationTab";
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
    <Stack aria-label="Main" component="nav" direction="row" sx={{ alignItems: "stretch" }}>
      {links.map(({ href, label }) => {
        const familyPath = href.split("/").slice(0, 2).join("/") || "/";
        const active =
          familyPath === "/" ? router.pathname === "/" : router.asPath.startsWith(familyPath);
        return <NavigationTab primary active={active} href={href} key={href} label={label} />;
      })}
    </Stack>
  );
};

const PublicNavigation = () => (
  <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 1 }}>
    <HeaderLogo variant="light" />
    <Box sx={{ ml: "auto" }}>
      <NavigationLinks authenticated={false} />
    </Box>
    <UserMenu />
  </Toolbar>
);

const AuthenticatedNavigation = () => (
  <>
    <Toolbar disableGutters sx={{ borderBottom: 1, borderColor: "divider", minHeight: 64 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          alignSelf: "stretch",
          bgcolor: "#20262b",
          color: "white",
          minWidth: { sm: 390 },
          px: { xs: 1.5, sm: 2.5 },
        }}
      >
        <HeaderLogo />
        <Divider
          flexItem
          orientation="vertical"
          sx={{ borderColor: "rgba(255,255,255,.18)", mx: { xs: 1, sm: 2 } }}
        />
        <OrganisationIdentity />
      </Stack>
      <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
        <NavigationLinks authenticated />
      </Box>
      <Box sx={{ color: "text.primary", mr: 2 }}>
        <UserMenu />
      </Box>
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
