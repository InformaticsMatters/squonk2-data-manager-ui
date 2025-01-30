import { useMemo, useState } from "react";

import { type SDFRecord } from "@squonk/sdf-parser";

import { Alert, AlertTitle, Box, LinearProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

import { MolCard } from "../../components/MolCard";
import CalculationsTable from "../../components/MolCard/CalculationsTable";
import { ScatterPlot } from "../../components/ScatterPlot/ScatterPlot";
import { censorConfig, type SDFViewerConfig } from "../../utils/api/sdfViewer";

const getCards = (molecules: Must<Molecule>[], propsToHide: string[] = []) => {
  return molecules.slice(0, 50).map((molecule) => {
    const properties = Object.entries(molecule.properties)
      .map((property) => ({ name: property[0], value: property[1] }))
      .filter((property) => !propsToHide.includes(property.name));
    return (
      <MolCard
        depictParams={{ depictURL: process.env.NEXT_PUBLIC_DEPICT_API_SERVER ?? "" }}
        key={molecule.id}
        molFile={molecule.molFile}
        variant="molFile"
      >
        {properties.length > 0 ? (
          <CalculationsTable fontSize="0.7rem" properties={properties} />
        ) : null}
      </MolCard>
    );
  });
};

const getPropArrayFromRecords = (molecules: Molecule[] | SDFRecord[]): string[] => {
  return molecules.reduce<string[]>((properties, molecule) => {
    Object.keys(molecule.properties).forEach((key) => {
      if (!properties.includes(key)) {
        properties.push(key);
      }
    });
    return properties;
  }, []);
};

const useSDFRecords = (project: string, path: string, file: string, config: SDFViewerConfig) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const queryParams = new URLSearchParams({
    project,
    path,
    file,
    config: censorConfig(config),
  });
  const url = `${basePath}/api/sdf-parser?${queryParams.toString()}`;

  return useQuery<SDFRecord[], Error, SDFRecord[], string[]>({
    queryKey: ["sdf", project, path, file],
    queryFn: async () => {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      throw new Error(await response.text());
    },
    refetchOnWindowFocus: false,
  });
};

export interface Molecule extends SDFRecord {
  id: string;
}

export type Must<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export const recordsToMolecules = (records: SDFRecord[]): Must<Molecule>[] => {
  return records
    .filter((record): record is Must<SDFRecord> => !!record.molFile)
    .map((record) => ({
      id: nanoid(),
      ...record,
    }));
};

export interface SDFViewerDataProps {
  project: string;
  path: string;
  file: string;
  config: SDFViewerConfig;
}

export const SDFViewerData = ({ project, path, file, config }: SDFViewerDataProps) => {
  const { data, isFetching, error } = useSDFRecords(project, path, file, config);

  const records = useMemo(() => data ?? [], [data]);

  const molecules = useMemo(() => recordsToMolecules(records), [records]);
  const properties = useMemo(() => getPropArrayFromRecords(records), [records]);

  const propsToHide = Object.entries(config)
    .filter(([_field, property]) => !property.cardView)
    .map((entry) => entry[0]);

  const [selection, setSelection] = useState<string[]>([]);

  if (isFetching) {
    return (
      <>
        <Typography sx={{ textAlign: "center" }}>Loading and parsing data</Typography>
        <LinearProgress />
      </>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error.message}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(144px, auto))",
        gap: 2,
        alignItems: "start",
      }}
    >
      <Box sx={{ gridColumn: "1 / 5" }}>
        <ScatterPlot
          molecules={molecules}
          properties={properties}
          selectPoints={(points) => setSelection(points)}
          width={600}
        />
      </Box>
      {getCards(
        selection
          .map((id) => molecules.find((molecule) => molecule.id === id))
          .filter((molecule): molecule is Must<Molecule> => !!molecule),
        propsToHide,
      )}
    </Box>
  );
};
