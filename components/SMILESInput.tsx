import { useEffect, useState } from "react";

import { DeleteForever as DeleteForeverIcon, Edit as EditIcon } from "@mui/icons-material";
import { Box, Button, ButtonGroup, IconButton, TextField, Tooltip } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import dynamic from "next/dynamic";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { getErrorMessage } from "../utils/next/orvalError";
import { CenterLoader } from "./CenterLoader";
import type { SketcherProps } from "./Sketcher";

const Sketcher = dynamic<SketcherProps>(() => import("./Sketcher").then((mod) => mod.Sketcher), {
  ssr: false,
  loading: () => <CenterLoader />,
});

export interface SMILESInputProps {
  /**
   * the controlled smiles value of the component
   */
  value: string;
  /**
   * called when the sketcher is closed and saved
   * @param smiles the new smiles value
   * @returns nothing
   */
  onSave: (smiles: string) => void;
  /**
   * called when the delete button is clicked
   * @returns nothing
   */
  onDelete: () => void;
  /**
   * whether the sketcher is displayed by default or not
   */
  initialMode?: "smiles" | "sketcher";
  /**
   * Width of sketcher canvas
   */
  width?: string | number;
  /**
   * Height of sketcher canvas
   */
  height?: string | number;
}

/**
 * Input for molecules in SMILES format. By default the input is a simple text field. A sketcher
 * component can be displayed to allow a structure to be drawn. This is then converted to smiles
 * when the user clicks a save button.
 */
export const SMILESInput = ({
  value,
  initialMode = "smiles",
  width = "700px",
  height = "500px",
  onSave,
  onDelete,
}: SMILESInputProps) => {
  const { enqueueError } = useEnqueueError();

  const [smiles, setSmiles] = useState(value);
  const [mode, setMode] = useState(initialMode);

  // Synchronise the controlled prop to the uncontrolled state
  useEffect(() => {
    setSmiles(value);
  }, [value]);

  if (mode === "smiles") {
    return (
      <>
        <IconButton sx={{ mr: 1 }} onClick={onDelete}>
          <DeleteForeverIcon />
        </IconButton>
        <TextField label="SMILES" value={smiles} onChange={(event) => onSave(event.target.value)} />
        <Tooltip title="Use a molecule sketcher">
          <IconButton sx={{ ml: 1 }} onClick={() => setMode("sketcher")}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      </>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1} width={width}>
      <Box height={height}>
        <Sketcher smiles={smiles} />
      </Box>
      <ButtonGroup size="small" sx={{ alignSelf: "end" }} variant="outlined">
        <Button color="warning" onClick={onDelete}>
          Delete
        </Button>
        <Button color="info" onClick={() => setMode("smiles")}>
          Cancel
        </Button>
        <Button
          onClick={async () => {
            const ketcher = global.ketcher;
            try {
              const smi = await ketcher?.getSmiles();
              if (smi) {
                setSmiles(smi);
                setMode("smiles");
                onSave(smi);
                global.ketcher = undefined;
              } else {
                enqueueError("Smiles not obtained");
              }
            } catch (error) {
              if (error !== undefined) {
                console.error(error);
                enqueueError(getErrorMessage(error));
                captureException(error);
              }
            }
          }}
        >
          Save
        </Button>
      </ButtonGroup>
    </Box>
  );
};
