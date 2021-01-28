import { Container, Typography } from '@material-ui/core';

import LoginButton from '../components/LoginButton';
import { CurrentProjectProvider } from '../context/currentProject';
import { ProjectsProvider } from '../context/projects';
import { UserProfileProvider } from '../context/userProfile';
import DataTierAPI from '../Services/DataTierAPI';
import DataTierView from './DataTierView';

interface IProps {}

/**
 * Providers, auth management and page layout
 */
const MainView: React.FC<IProps> = () => {
  return (
    <Container component="main">
      <Typography variant="h2" component="h1">
        Squonk Data Manager
      </Typography>
      <LoginButton />
      {DataTierAPI.hasToken() && (
        <UserProfileProvider>
          <ProjectsProvider>
            <CurrentProjectProvider>
              <DataTierView />
            </CurrentProjectProvider>
          </ProjectsProvider>
        </UserProfileProvider>
      )}
    </Container>
  );
};

export default MainView;
