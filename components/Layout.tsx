import type { FC } from "react";

import { Box, LinearProgress } from "@mui/material";

import { useIsTransitioning } from "../hooks/useIsTransitioning";
import { Footer } from "./Footer";
import Header from "./Header";

const Layout: FC = ({ children }) => {
  const isTransitioning = useIsTransitioning(false);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      {isTransitioning && <LinearProgress />}
      {/* <Slide appear direction="right" in={!isTransitioning}> */}
      <Box component="main" paddingY={2}>
        {children}
      </Box>
      {/* </Slide> */}
      <Footer />
    </Box>
  );
};

export default Layout;
