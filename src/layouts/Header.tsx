import { AppBar, Toolbar } from "@mui/material";

import { HeaderLogo } from "../components/logo/HeaderLogo";
import { NavBarContents } from "./navigation/NavBarContents";

const Header = () => {
  return (
    <AppBar position="static" sx={{ displayPrint: "none" }}>
      <Toolbar>
        <HeaderLogo />

        <NavBarContents />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
