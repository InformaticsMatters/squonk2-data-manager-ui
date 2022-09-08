import { useState } from "react";

import FindInPageRoundedIcon from "@mui/icons-material/FindInPageRounded";
import { ListItem, ListItemText } from "@mui/material";

import { DatasetSchemaViewModal } from "./DatasetSchemaViewModal";

export type DatasetSchemaListItemProps = {
  /**
   * ID of the dataset to manage the schema of a dataset version
   */
  datasetId: string;
  /**
   * Version number of the version to manage
   */
  version: number;
};

/**
 * MuiListItem with an action that open a modal that lets the user manage the schema of a version
 * of a dataset. The user can edit the dataset schema description, field descriptions and types.
 */
export const DatasetSchemaListItem = ({ datasetId, version }: DatasetSchemaListItemProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText
          primary="View and Edit the Dataset Schema"
          secondary="View the available fields and their description and data type"
        />
        <FindInPageRoundedIcon color="action" />
      </ListItem>

      <DatasetSchemaViewModal
        datasetId={datasetId}
        open={open}
        version={version}
        onClose={() => setOpen(false)}
      />
    </>
  );
};