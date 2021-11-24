import type { FC } from 'react';
import { useLayoutEffect } from 'react';
import { useState } from 'react';
import React from 'react';

import type { DatasetSummary, DatasetVersionSummary } from '@squonk/data-manager-client';

import { Container, Link, List } from '@material-ui/core';

import { useKeycloakUser } from '../../../hooks/useKeycloakUser';
import { ModalWrapper } from '../../modals/ModalWrapper';
import { PageSection } from '../../PageSection';
import { VersionInfoSection } from './VersionInfoSection/VersionInfoSection';
import { ManageDatasetEditorsSection } from './ManageDatasetEditorsSection';
import { NewVersionListItem } from './NewVersionListItem';
import { VersionActionsSection } from './VersionActionsSection';
import { VersionViewSection } from './VersionViewSection';
import { WorkingVersionSection } from './WorkingVersionSection';

export interface DatasetDetailsProps {
  /**
   * A dataset `version` belongs to.
   */
  dataset: DatasetSummary;
  /**
   * A selected dataset version.
   */
  version: DatasetVersionSummary;
  /**
   * Name of the dataset.
   */
  datasetName: string;
}

/**
 * A component which displays details about a selected dataset version with actions related to the
 * version
 */
export const DatasetDetails: FC<DatasetDetailsProps> = ({ dataset, version, datasetName }) => {
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(version);

  const { user } = useKeycloakUser();

  const isEditor = !!user.username && dataset.editors.includes(user.username);
  const isOwner = dataset.owner === user.username;
  const editable = isEditor || isOwner;

  useLayoutEffect(() => {
    setSelectedVersion(version);
  }, [version]);

  return (
    <>
      <Link component="button" variant="body1" onClick={() => setOpen(true)}>
        {datasetName}
      </Link>

      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id={`${dataset.dataset_id}-details`}
        open={open}
        title={`Dataset ${datasetName}`}
        onClose={() => setOpen(false)}
      >
        <Container maxWidth="md">
          <PageSection level={3} title="Dataset Actions">
            {editable && (
              <>
                <List>
                  <NewVersionListItem dataset={dataset} datasetName={datasetName} edge="end" />
                </List>

                <PageSection title="Editors">
                  <ManageDatasetEditorsSection dataset={dataset} />
                </PageSection>
              </>
            )}

            <PageSection title="Working Version">
              <WorkingVersionSection
                dataset={dataset}
                editable={editable}
                setVersion={setSelectedVersion}
                version={selectedVersion}
              />
            </PageSection>

            <PageSection title="Information">
              <VersionInfoSection version={selectedVersion} />
            </PageSection>

            <PageSection title="View">
              <VersionViewSection dataset={dataset} version={selectedVersion} />
            </PageSection>

            <PageSection title="Actions">
              <VersionActionsSection
                dataset={dataset}
                editable={editable}
                setVersion={setSelectedVersion}
                version={selectedVersion}
              />
            </PageSection>

            {/* DEBUG options. This allows access of dataset-id etc without leaving the UI */}
            {process.env.NODE_ENV === 'development' && (
              <PageSection title="Technical Information">
                <pre>{JSON.stringify(dataset, null, 2)}</pre>
              </PageSection>
            )}
          </PageSection>
        </Container>
      </ModalWrapper>
    </>
  );
};
