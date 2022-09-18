import { AppBar, Toolbar } from "@mui/material";

import { Logo } from "./navigation/Logo";
import { NavBarContents } from "./navigation/NavBarContents";

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Logo />

        <NavBarContents />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
