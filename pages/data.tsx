import Link from 'next/link';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  useGetAvailableDatasets,
  useGetAvailableProjects,
  useUploadDataset,
} from '@squonk/data-manager-client';

import Layout from '../components/Layout';

const Data = () => {
  const { data: datasets } = useGetAvailableDatasets();
  const { data: projects } = useGetAvailableProjects();
  const uploadDatasetMutation = useUploadDataset();

  return (
    <Layout>
      <h1>Data Page</h1>
      {JSON.stringify(datasets)}
      {JSON.stringify(projects)}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const files = (e.target as any)['files'].files;

          uploadDatasetMutation.mutate({
            data: {
              as_filename: 'testName.sdf',
              dataset_file: files[0],
              dataset_type: 'chemical/x-mdl-sdfile',
            },
          });
        }}
      >
        <input type="file" name="files" multiple />
        <input type="submit" name="submit" />
      </form>
      <Link href="/">Home</Link>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
