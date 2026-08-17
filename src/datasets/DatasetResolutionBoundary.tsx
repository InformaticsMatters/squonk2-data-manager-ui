import { type ReactNode } from "react";

import { Alert, Button, type SxProps, type Theme } from "@mui/material";
import NextError from "next/error";

import { CenterLoader } from "../components/CenterLoader";
import { type DatasetVersionResolution } from "./resolveDatasetVersion";

type ResolvedDatasetVersion = Extract<DatasetVersionResolution, { kind: "resolved" }>;

export interface DatasetLoadErrorProps {
  message: string;
  onRetry: () => void;
  sx?: SxProps<Theme>;
}

export const DatasetLoadError = ({ message, onRetry, sx }: DatasetLoadErrorProps) => (
  <Alert
    action={
      <Button color="inherit" size="small" onClick={onRetry}>
        Retry
      </Button>
    }
    severity="error"
    sx={sx}
  >
    {message}
  </Alert>
);

export interface DatasetResolutionBoundaryProps {
  children: (resolution: ResolvedDatasetVersion) => ReactNode;
  error: unknown;
  errorMessage: string;
  errorSx?: SxProps<Theme>;
  isLoading: boolean;
  isPending?: boolean;
  onRetry: () => void;
  resolution?: DatasetVersionResolution;
}

export const DatasetResolutionBoundary = ({
  children,
  error,
  errorMessage,
  errorSx,
  isLoading,
  isPending = false,
  onRetry,
  resolution,
}: DatasetResolutionBoundaryProps) => {
  if (error) {
    return <DatasetLoadError message={errorMessage} sx={errorSx} onRetry={onRetry} />;
  }
  if (isLoading || isPending) {
    return <CenterLoader />;
  }
  if (!resolution || resolution.kind === "dataset-not-found") {
    return <NextError statusCode={404} title="Dataset not found" />;
  }
  if (resolution.kind === "version-not-found") {
    return <NextError statusCode={404} title="Dataset version not found" />;
  }
  return children(resolution);
};
