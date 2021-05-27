import { withPageAuthRequired } from '@auth0/nextjs-auth0';

import Layout from '../components/Layout';

const Tasks = () => {
  return (
    <Layout>
      <h1>Tasks Page</h1>
    </Layout>
  );
};

export default withPageAuthRequired(Tasks);
