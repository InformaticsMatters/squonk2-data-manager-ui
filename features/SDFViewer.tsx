import { useEffect, useMemo, useState, useTransition } from "react";

import type { SDFRecord } from "@squonk/sdf-parser";
import { createSDFTransformer } from "@squonk/sdf-parser";

import { Box, LinearProgress, Typography } from "@mui/material";
import { nanoid } from "nanoid";

import { MolCard } from "../components/MolCard";
import CalculationsTable from "../components/MolCard/CalculationsTable";
import { ScatterPlot } from "../components/ScatterPlot/ScatterPlot";
import { isResponseJson } from "../utils/api/fetchHelpers";
import { API_ROUTES } from "../utils/app/routes";

const getCards = (molecules: Must<Molecule>[]) => {
  return molecules.slice(0, 50).map((molecule) => {
    const smiles = molecule.molFile.split(/\r?\n/)[0];
    const properties = Object.entries(molecule.properties).map((property) => ({
      name: property[0],
      value: property[1],
    }));
    return (
      <MolCard key={molecule.id} smiles={smiles}>
        <CalculationsTable
          calcs={Object.keys(molecule.properties).reduce((acc, key) => {
            acc[key] = key;
            return acc;
          }, {} as Record<string, any>)}
          fontSize="0.7rem"
          properties={properties}
        />
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

const useSDFRecords = (projectId: string, path: string, fileName: string) => {
  const [records, setRecords] = useState<SDFRecord[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const compressed = fileName.endsWith(".gz");
    const fetchFile = async () => {
      setIsFetching(true);

      let response: Response;

      try {
        response = await fetch(API_ROUTES.projectFile(projectId, path, fileName, "/api/dm-api"));
      } catch {
        throw new Error("Unable to fetch file due to a network error. Try again.");
      }

      if (response.ok) {
        if (response.body !== null) {
          let stream: ReadableStream = response.body;
          if (compressed) {
            stream = response.body.pipeThrough(new DecompressionStream("gzip"));
          }
          await stream
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(createSDFTransformer())
            .pipeTo(
              new WritableStream({
                write(chunk) {
                  startTransition(() => {
                    setRecords((prev) => [...prev, chunk]);
                  });
                },
              }),
            );
        } else {
          throw new Error("No stream from response");
        }

        setIsFetching(false);
      } else {
        const isJson = isResponseJson(response);
        const data = isJson ? await response.json() : null;
        const error = (data && data.message) || response.status;
        throw new Error(error);
      }
    };

    fetchFile().catch((err) => {
      setError(err.message);
    });
  }, [fileName, path, projectId]);

  return { records, isFetching, isPending, error };
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

export interface SDFViewerProps {
  project: string;
  path: string;
  file: string;
}

export const SDFViewer = ({ project, path, file }: SDFViewerProps) => {
  const { records, isPending, isFetching } = useSDFRecords(project, path, file);

  const molecules = useMemo(() => recordsToMolecules(records), [records]);
  const properties = useMemo(() => getPropArrayFromRecords(records), [records]);

  const [selection, setSelection] = useState<string[]>([]);

  if (isPending || isFetching) {
    return (
      <>
        <Typography textAlign="center">Loading and parsing data</Typography>
        <LinearProgress />
      </>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))",
        gridGap: (theme) => theme.spacing(2),
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
      )}
    </Box>
  );
};
