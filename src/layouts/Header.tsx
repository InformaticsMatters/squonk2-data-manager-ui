import { AppBar } from "@mui/material";

import { NavBarContents } from "./navigation/NavBarContents";

const Header = () => {
  return (
    <AppBar position="static">
      <NavBarContents />
    </AppBar>
  );
};

export default Header;
