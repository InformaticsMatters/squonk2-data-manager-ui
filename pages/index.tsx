import { useUser } from '@auth0/nextjs-auth0';

import Layout from '../components/Layout';

export default function Index() {
  const { user, error, isLoading } = useUser();
  return (
    <Layout user={user} authLoading={isLoading} authError={error}>
      <h1>Home Page</h1>
    </Layout>
  );
}
