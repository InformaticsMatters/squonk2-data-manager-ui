import { AppBar } from "@mui/material";

import { NavBarContents } from "./navigation/NavBarContents";

const Header = () => {
  return (
    <AppBar color="inherit" elevation={0} position="static">
      <NavBarContents />
    </AppBar>
  );
};

export default Header;
