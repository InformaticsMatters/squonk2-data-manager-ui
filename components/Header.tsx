import { AppBar, Toolbar } from '@material-ui/core';

import { Logo } from './navigation/Logo';
import { ToolbarContents } from './navigation/ToolbarContents';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Logo />

        <ToolbarContents />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
