import { useRef, useState } from "react";

import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

import type { FILE_PROTOCOL } from "../../../utils/app/urls";
import { addFileProtocol, removeFileProtocol } from "../../../utils/app/urls";
import type { FileSelection, SharedProps } from "../../FileSelector";
import { FileSelector } from "../../FileSelector";
import { SMILESInput } from "../../SMILESInput";

export interface MultipleMoleculeInputProps
  extends Omit<SharedProps, "onSelect" | "value" | "targetType" | "multiple"> {
  value: FileSelection;
  onMoleculesChange: (newValue: string[]) => void;
  onFileSelect: (selection: FileSelection) => void;
  reset: () => void;
  protocol?: FILE_PROTOCOL;
}

export type InputMethod = "smiles" | "files";

const addProtocolToFiles = (value: FileSelection) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return addFileProtocol(value);
  }

  return value.map(addFileProtocol);
};

const removeProtocolFromFiles = (value: FileSelection) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return removeFileProtocol(value);
  }

  return value.map(removeFileProtocol);
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
  const id = useRef(Math.floor(Math.random() * 1000)).current;
  const [inputMethod, setInputMethod] = useState<InputMethod>("smiles");

  return (
    <>
      <FormControl>
        <FormLabel id={`input-method-${id}`}>Method</FormLabel>
        <RadioGroup
          row
          aria-labelledby={`input-method-${id}`}
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
  value: string | string[] | undefined;
  onMoleculesChange: (newValue: string[]) => void;
}

export const SketcherInputs = ({ value, onMoleculesChange }: SketcherInputsProps) => {
  // Normalise the input value to be a multi-line string
  if (value === undefined) {
    value = "";
  } else if (Array.isArray(value)) {
    value = value.join("\n");
  }

  // Then split it into an array
  const valueArray = value.split("\n");

  return (
    <>
      {valueArray.map((smiles, index) => (
        <Box key={index} mb={2}>
          <SMILESInput
            value={smiles}
            onDelete={() => {
              const newValue = [...valueArray];
              newValue.splice(index, 1);
              onMoleculesChange(newValue);
            }}
            onSave={(smi) => {
              const newValue = [...valueArray];
              newValue[index] = smi;
              onMoleculesChange(newValue);
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
