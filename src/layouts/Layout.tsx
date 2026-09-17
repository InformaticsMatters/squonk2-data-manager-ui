import { Activity, type ReactNode } from "react";

import { Box, LinearProgress, NoSsr, useMediaQuery, useTheme } from "@mui/material";
import { useAtomValue } from "jotai";

import {
  EventStreamSidebar,
  WIDE_DESKTOP_SIDEBAR_WIDTH,
} from "../components/eventStream/EventStreamSidebar";
import { CookiesBanner } from "../components/legal/CookiesBanner";
import { PrototypeSwitcher } from "../components/PrototypeSwitcher";
import { useIsTransitioning } from "../hooks/useIsTransitioning";
import { eventStreamSidebarOpenAtom } from "../state/eventStream";
import { AdminBannerPrototype, adminBannerVariants } from "./AdminBanner.prototype";
import { Footer } from "./Footer";
import Header from "./Header";

export interface LayoutProps {
  children: ReactNode;
}

// Wow this layout was a lot trickier than I expected!
// I had to use floats to get the sidebar to behave properly with sticky positioning

const Layout = ({ children }: LayoutProps) => {
  const isTransitioning = useIsTransitioning(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isEventSidebarOpen = useAtomValue(eventStreamSidebarOpenAtom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box sx={{ zIndex: 1, displayPrint: "none" }}>
        <Header />
      </Box>
      {/* Its own flex item above the header's and the footer's stacking contexts, both zIndex 1. */}
      <Box sx={{ zIndex: 2, displayPrint: "none" }}>
        <AdminBannerPrototype />
      </Box>
      {/* Reserve space for the LinearProgress to avoid layout shift */}
      <Box sx={{ minHeight: 4 }}>
        <Activity mode={isTransitioning ? "visible" : "hidden"}>
          <LinearProgress sx={{ zIndex: 1 }} />
        </Activity>
      </Box>
      <Box sx={{ position: "relative", overflow: "visible" }}>
        <Box
          component="main"
          sx={{
            paddingY: 2,
            width: `calc(calc(100vw - (100vw - 100%)) - ${isEventSidebarOpen ? WIDE_DESKTOP_SIDEBAR_WIDTH : 0}px)`,
            float: "left",
          }}
        >
          <div>{children}</div>
        </Box>

        <Activity mode={isDesktop && isEventSidebarOpen ? "visible" : "hidden"}>
          <Box
            component="aside"
            id="my_sticky"
            sx={{
              float: "right",
              width: WIDE_DESKTOP_SIDEBAR_WIDTH,
              position: "sticky",
              top: 0,
              marginTop: "-4px",
              // zIndex: -1,
            }}
          >
            <EventStreamSidebar />
          </Box>
        </Activity>

        {/* Clear float to maintain container height */}
        {!!isDesktop && !!isEventSidebarOpen && <Box sx={{ clear: "both" }} />}
      </Box>

      <Box sx={{ zIndex: 1, marginTop: "auto", displayPrint: "none" }}>
        <Footer />
      </Box>
      <NoSsr>
        <CookiesBanner />
      </NoSsr>
      <NoSsr>
        <PrototypeSwitcher variants={adminBannerVariants} />
      </NoSsr>
    </Box>
  );
};

export default Layout;
