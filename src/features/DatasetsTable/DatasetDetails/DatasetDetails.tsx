import { type FC, useLayoutEffect, useState } from "react";

import { type DatasetSummary, type DatasetVersionSummary } from "@squonk/data-manager-client";

import { Container, Link, List, Typography } from "@mui/material";

import { Labels } from "../../../components/labels/Labels";
import { NewLabelButton } from "../../../components/labels/NewLabelButton";
import { ModalWrapper } from "../../../components/modals/ModalWrapper";
import { PageSection } from "../../../components/PageSection";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { ManageDatasetEditorsSection } from "./ManageDatasetEditorsSection";
import { NewVersionListItem } from "./NewVersionListItem";
import { VersionActionsSection } from "./VersionActionsSection";
import { VersionInfoSection } from "./VersionInfoSection";
import { VersionViewSection } from "./VersionViewSection";
import { WorkingVersionSection } from "./WorkingVersionSection";

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

  const editable = !!user.username && dataset.editors.includes(user.username);

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
          <PageSection level={2} title="Dataset Actions">
            {!!editable && (
              <>
                <List>
                  <NewVersionListItem dataset={dataset} datasetName={datasetName} edge="end" />
                </List>

                <PageSection title="Editors">
                  <ManageDatasetEditorsSection dataset={dataset} />
                </PageSection>

                <Typography gutterBottom component="h4" variant="h5">
                  Labels <NewLabelButton datasetId={dataset.dataset_id} />
                </Typography>
                <Labels datasetId={dataset.dataset_id} datasetVersion={version} />
              </>
            )}

            <PageSection title="Working Version">
              <WorkingVersionSection
                dataset={dataset}
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
            {process.env.NODE_ENV === "development" && (
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
