import React from 'react';

import { Paper } from '@material-ui/core';

import DataTable from '../components/DataTable/DataTable';
import ProjectManager from '../components/ProjectManager';
import UploadFileButton from '../components/UploadFileButton';
import { DatasetsProvider } from '../context/datasets';
import { useCurrentProject } from '../hooks/useCurrentProject';

/**
 * Main application view with data-tier functionality
 */
const DataTierView = () => {
  const { currentProject, setCurrentProject } = useCurrentProject();

  return (
    <DatasetsProvider project={currentProject}>
      <UploadFileButton currentProject={currentProject} />
      <ProjectManager currentProject={currentProject} setCurrentProject={setCurrentProject} />
      <Paper>
        <DataTable />
      </Paper>
    </DatasetsProvider>
  );
};

export default DataTierView;
