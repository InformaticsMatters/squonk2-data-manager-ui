import { Description } from "@mui/icons-material";
import { ListItemButton, ListItemText } from "@mui/material";
import A from "next/link";

import { useFamilyRoute } from "../../../../application/FamilyRouteBoundary";
import { datasetLinks, datasetListState, type DatasetRoute } from "../../../../datasets/routes";

export interface DatasetPlainTextViewerListItemProps {
  datasetId: string;
  version: number;
}

export const DatasetPlainTextViewerListItem = ({
  datasetId,
  version,
}: DatasetPlainTextViewerListItemProps) => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : (familyRoute.route as DatasetRoute);
  const state = route ? datasetListState(route) : {};
  return (
    <ListItemButton component={A} href={datasetLinks.view(datasetId, version, state) as never}>
      <ListItemText
        primary="Plaintext Viewer"
        secondary="Displays the dataset version as plaintext"
      />
      <Description color="action" />
    </ListItemButton>
  );
};
