import Link from 'next/link';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { Container } from '@material-ui/core';
import {
  useGetAvailableDatasets,
  useGetAvailableProjects,
  useUploadDataset,
} from '@squonk/data-manager-client';

import Layout from '../components/Layout';
import ProjectManager from '../components/ProjectManager';

const Data = () => {
  const { data: datasets } = useGetAvailableDatasets();
  const { data: projects } = useGetAvailableProjects();
  const uploadDatasetMutation = useUploadDataset();

  return (
    <Layout>
      <Container>
        <ProjectManager />
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Data);
