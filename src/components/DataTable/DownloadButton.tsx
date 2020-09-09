import React from 'react';

import { IconButton, Tooltip } from '@material-ui/core';
import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';

import { useCurrentProject } from '../../hooks/useCurrentProject';
import { Dataset } from '../../Services/apiTypes';
import DataTierAPI from '../../Services/DataTierAPI';

interface IProps {
  dataset: Dataset;
}

const DownloadButton: React.FC<IProps> = ({ dataset: { datasetId, name } }) => {
  const { currentProject } = useCurrentProject();

  const handleDownload = async () => {
    if (currentProject !== null) {
      const element = document.createElement('a');
      const blob = await DataTierAPI.downloadDatasetFromProjectAsNative(
        currentProject.projectId,
        datasetId,
      );

      element.href = URL.createObjectURL(blob);
      element.download = name;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };
  return (
    <Tooltip arrow title="Download">
      <IconButton onClick={handleDownload}>
        <GetAppRoundedIcon />
      </IconButton>
    </Tooltip>
  );
};

export default DownloadButton;
