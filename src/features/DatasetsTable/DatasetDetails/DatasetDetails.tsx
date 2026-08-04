import { type FC } from "react";

import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

import { Container, List, Typography } from "@mui/material";

import { Labels } from "../../../components/labels/Labels";
import { NewLabelButton } from "../../../components/labels/NewLabelButton";
import { ModalWrapper } from "../../../components/modals/ModalWrapper";
import { PageSection } from "../../../components/PageSection";
import {
  evaluateDatasetDeletionCapability,
  evaluateDatasetEditorCapability,
  evaluateDatasetLabelCapability,
} from "../../../datasets/capabilities";
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
  onClose: () => void;
  onVersionChange: (version: DatasetVersionSummary) => void;
  onVersionDeleted: () => void;
}

/**
 * A component which displays details about a selected dataset version with actions related to the
 * version
 */
export const DatasetDetails: FC<DatasetDetailsProps> = ({
  dataset,
  version,
  datasetName,
  onClose,
  onVersionChange,
  onVersionDeleted,
}) => {
  const { user } = useKeycloakUser();
  const capabilityFacts = { caller: { username: user.username }, dataset, version };
  const labelCapability = evaluateDatasetLabelCapability(capabilityFacts);
  const editorCapability = evaluateDatasetEditorCapability(capabilityFacts);
  const deletionCapability = evaluateDatasetDeletionCapability(capabilityFacts);
  const editable = labelCapability.status === "enabled";

  return (
    <ModalWrapper
      open
      DialogProps={{ fullScreen: true }}
      id={`${dataset.dataset_id}-details`}
      title={`Dataset ${datasetName}`}
      onClose={onClose}
    >
      <Container maxWidth="md">
        <PageSection level={2} title="Dataset Actions">
          <>
            {!!editable && (
              <List>
                <NewVersionListItem dataset={dataset} datasetName={datasetName} edge="end" />
              </List>
            )}

            <PageSection title="Editors">
              <ManageDatasetEditorsSection
                capability={editorCapability}
                dataset={dataset}
                version={version}
              />
            </PageSection>

            <Typography gutterBottom component="h4" variant="h5">
              Labels{" "}
              <NewLabelButton
                capability={labelCapability}
                datasetId={dataset.dataset_id}
                datasetVersion={version.version}
              />
            </Typography>
            {labelCapability.status === "disabled" && (
              <Typography color="text.secondary" variant="body2">
                {labelCapability.reason}
              </Typography>
            )}
            <Labels
              capability={labelCapability}
              datasetId={dataset.dataset_id}
              datasetVersion={version}
            />
          </>

          <PageSection title="Working Version">
            <WorkingVersionSection
              dataset={dataset}
              version={version}
              onVersionChange={onVersionChange}
            />
          </PageSection>

          <PageSection title="Information">
            <VersionInfoSection version={version} />
          </PageSection>

          <PageSection title="View">
            <VersionViewSection dataset={dataset} version={version} />
          </PageSection>

          <PageSection title="Actions">
            <VersionActionsSection
              dataset={dataset}
              deletionCapability={deletionCapability}
              version={version}
              onVersionDeleted={onVersionDeleted}
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
  );
};
