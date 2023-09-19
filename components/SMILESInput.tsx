import { useEffect, useState } from "react";

import { DeleteForever as DeleteForeverIcon, Edit as EditIcon } from "@mui/icons-material";
import { Box, Button, ButtonGroup, IconButton, TextField, Tooltip } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import dynamic from "next/dynamic";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { useIsASketcherOpen } from "../state/sketcherState";
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
  onDelete?: () => void;
  /**
   * Called when the sketcher opens
   */
  onOpen?: () => void;
  /**
   * Called when the sketcher closes
   */
  onClose?: () => void;
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
  /**
   * Whether the edit button to enable the sketcher should be disabled
   */
  sketcherDisabled: boolean;
}

/**
 * Input for molecules in SMILES format. By default the input is a simple text field. A sketcher
 * component can be displayed to allow a structure to be drawn. This is then converted to smiles
 * when the user clicks a save button.
 */
export const SMILESInput = ({
  value,
  initialMode = "smiles",
  width = "850px",
  height = "500px",
  sketcherDisabled,
  onSave,
  onDelete,
  onOpen,
  onClose,
}: SMILESInputProps) => {
  const { enqueueError } = useEnqueueError();

  const [smiles, setSmiles] = useState(value);
  const [mode, setMode] = useState(initialMode);

  const [, setIsASketcherOpen] = useIsASketcherOpen();

  // Synchronise the controlled prop to the uncontrolled state
  useEffect(() => {
    setSmiles(value);
  }, [value]);

  if (mode === "smiles") {
    return (
      <>
        <Tooltip title="Delete this molecule">
          <IconButton sx={{ mr: 1 }} onClick={onDelete}>
            <DeleteForeverIcon />
          </IconButton>
        </Tooltip>
        <TextField label="SMILES" value={smiles} onChange={(event) => onSave(event.target.value)} />
        <Tooltip
          title={
            sketcherDisabled ? "Only one sketcher may be used at once" : "Use a molecule sketcher"
          }
        >
          <span>
            <IconButton
              disabled={sketcherDisabled}
              sx={{ ml: 1 }}
              onClick={() => {
                setMode("sketcher");
                onOpen && onOpen();
              }}
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
      </>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1} width={width}>
      <Box height={height}>
        <Sketcher smiles={smiles} onUnmount={() => setIsASketcherOpen(false)} />
      </Box>
      <ButtonGroup size="small" sx={{ alignSelf: "end" }} variant="outlined">
        <Button
          color="warning"
          onClick={() => {
            onDelete && onDelete();
            onClose && onClose();
          }}
        >
          Delete
        </Button>
        <Button
          color="info"
          onClick={() => {
            setMode("smiles");
            onClose && onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={async () => {
            const ketcher = global.ketcher;
            try {
              const smi = await ketcher?.getSmiles();
              if (smi !== undefined) {
                setSmiles(smi);
                setMode("smiles");
                onSave(smi);
                global.ketcher = undefined;
                onClose && onClose();
              } else {
                enqueueError("Smiles not obtained");
              }
            } catch (error) {
              if (error !== undefined) {
                console.error(error);
                enqueueError(error);
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
