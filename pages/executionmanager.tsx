import { withPageAuthRequired } from '@auth0/nextjs-auth0';

import Layout from '../components/Layout';

const ExecutionManager = () => {
  return (
    <Layout>
      <h1>Execution Manager</h1>
    </Layout>
  );
};

export default withPageAuthRequired(ExecutionManager);
