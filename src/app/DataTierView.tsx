import React, { useState } from 'react';

import { Paper } from '@material-ui/core';

import DataTable from '../components/DataTable';
import ProjectManager from '../components/ProjectManager';
import UploadFileButton from '../components/UploadFileButton';
import { DatasetsProvider } from '../context/datasets';
import { Project } from '../Services/apiTypes';

const DataTierView = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

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
