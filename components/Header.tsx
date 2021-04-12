import Link from 'next/link';

import type { UserProfile } from '@auth0/nextjs-auth0';

interface HeaderProps {
  user?: UserProfile;
  authError?: Error;
  authLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, authError, authLoading }) => {
  if (authLoading) return <div>Loading...</div>;
  if (authError) return <div>{authError.message}</div>;

  if (user) {
    return (
      <ul>
        <li>
          Welcome {user.name}! <Link href="/api/auth/logout">Logout</Link>
        </li>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/data">Data</Link>
        </li>
      </ul>
    );
  }

  return <Link href="/api/auth/login">Login</Link>;
};

export default Header;
