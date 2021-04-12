import Header from './Header';

import type { UserProfile } from '@auth0/nextjs-auth0';

interface LayoutProps {
  user?: UserProfile;
  authLoading: boolean;
  authError?: Error;
}

const Layout: React.FC<LayoutProps> = ({ user, authLoading = false, authError, children }) => {
  return (
    <>
      <Header user={user} authLoading={authLoading} authError={authError} />
      <main>{children}</main>
    </>
  );
};

export default Layout;
