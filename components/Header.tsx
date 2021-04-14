import type { UserProfile } from '@auth0/nextjs-auth0';
interface HeaderProps {
  user?: UserProfile;
  authError?: Error;
  authLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, authError, authLoading }) => {
  return <div />;
};

export default Header;
