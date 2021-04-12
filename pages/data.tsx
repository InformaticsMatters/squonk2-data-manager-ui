import { useUser } from '@auth0/nextjs-auth0';
import {
  useGetAvailableDatasets,
  useGetAvailableProjects,
  useUploadDataset,
} from '@squonk/data-manager-client';

import Layout from '../components/Layout';

export default function Index() {
  const { user, error, isLoading } = useUser();

  const { data: datasets } = useGetAvailableDatasets();
  const { data: projects } = useGetAvailableProjects();
  const uploadDatasetMutation = useUploadDataset();

  return (
    <Layout user={user} authLoading={isLoading} authError={error}>
      <h1>Data Page</h1>
      {JSON.stringify(datasets)}
      {JSON.stringify(projects)}
      <button onClick={() => uploadDatasetMutation.mutate({ data: 1 })}>Upload</button>
    </Layout>
  );
}
