import { useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { nanoid } from "nanoid";

import { useIsASketcherOpen } from "../../../state/sketcherState";
import { addFileProtocol, FILE_PROTOCOL, removeFileProtocol } from "../../../utils/app/urls";
import { type FileSelection, FileSelector, type SharedProps } from "../../FileSelector";
import { SMILESInput } from "../../SMILESInput";

export interface MultipleMoleculeInputProps
  extends Omit<SharedProps, "multiple" | "onSelect" | "targetType" | "value"> {
  value: FileSelection;
  onMoleculesChange: (newValue: string[]) => void;
  onFileSelect: (selection: FileSelection) => void;
  reset: () => void;
  protocol?: FILE_PROTOCOL;
}

export type InputMethod = "files" | "smiles";

const addProtocolToFiles = (value: FileSelection) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return addFileProtocol(value);
  }

  return value.map((element) => addFileProtocol(element));
};

const removeProtocolFromFiles = (value: FileSelection) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return removeFileProtocol(value);
  }

  return value.map((element) => removeFileProtocol(element));
};

export const MultipleMoleculeInput = ({
  value,
  mimeTypes,
  projectId,
  protocol,
  onMoleculesChange,
  onFileSelect,
  reset,
}: MultipleMoleculeInputProps) => {
  const uuid = useRef(nanoid()).current;
  const initialValue = useRef(value).current;
  const method = useMemo(() => {
    if (typeof initialValue === "string") {
      return initialValue.startsWith(FILE_PROTOCOL) ? "files" : "smiles";
    }
    return initialValue?.map((val) => val.startsWith(FILE_PROTOCOL)).every(Boolean)
      ? "files"
      : "smiles";
  }, [initialValue]);

  const [inputMethod, setInputMethod] = useState<InputMethod>(method);

  return (
    <>
      <FormControl>
        <FormLabel id={`input-method-${uuid}`}>Method</FormLabel>
        <RadioGroup
          row
          aria-labelledby={`input-method-${uuid}`}
          value={inputMethod}
          onChange={(_event, value) => {
            reset();
            // Need to reset when input method is changed as values aren't compatible.
            // So need to determine what "type" the initialValue is to switch to that if it matches.
            setInputMethod(value as InputMethod);
          }}
        >
          <FormControlLabel control={<Radio />} label="SMILES" value="smiles" />
          <FormControlLabel control={<Radio />} label="Files" value="files" />
        </RadioGroup>
      </FormControl>
      {inputMethod === "smiles" ? (
        <SketcherInputs value={value} onMoleculesChange={onMoleculesChange} />
      ) : (
        <FileSelector
          mimeTypes={mimeTypes}
          multiple={false}
          projectId={projectId}
          targetType="file"
          value={protocol ? removeProtocolFromFiles(value) : value}
          onSelect={(selection) => onFileSelect(addProtocolToFiles(selection))}
        />
      )}
    </>
  );
};

interface SketcherInputsProps {
  value: string[] | string | undefined;
  onMoleculesChange: (newValue: string[]) => void;
}

export const SketcherInputs = ({ value, onMoleculesChange }: SketcherInputsProps) => {
  // Normalise the input value to be a multi-line string
  if (value === undefined) {
    value = "";
  } else if (Array.isArray(value)) {
    value = value.join("\n");
  }

  const [sketcherDisabled, setIsASketcherOpen] = useIsASketcherOpen();

  // Then split it into an array
  const valueArray = value.split("\n");

  return (
    <>
      {valueArray.map((smiles, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={index} sx={{ mb: 2 }}>
          <SMILESInput
            sketcherDisabled={sketcherDisabled}
            value={smiles}
            onDelete={() => {
              const newValue = [...valueArray];
              newValue.splice(index, 1);
              onMoleculesChange(newValue);
              setIsASketcherOpen(false);
            }}
            onOpen={() => setIsASketcherOpen(true)}
            onSave={(smi) => {
              const newValue = [...valueArray];
              newValue[index] = smi;
              onMoleculesChange(newValue);
              setIsASketcherOpen(false);
            }}
          />
        </Box>
      ))}
      <Button
        size="small"
        variant="outlined"
        onClick={() => onMoleculesChange([...valueArray, ""])}
      >
        Add Molecule
      </Button>
    </>
  );
};
