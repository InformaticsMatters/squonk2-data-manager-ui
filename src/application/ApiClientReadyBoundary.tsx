import { type ReactNode } from "react";

import { Alert } from "@mui/material";

import { CenterLoader } from "../components/CenterLoader";
import { useSetupApiClients } from "../hooks/useSetupApiClients";

export const ApiClientSetup = () => {
  useSetupApiClients();
  return null;
};

export const ApiClientReadyBoundary = ({ children }: { children: ReactNode }) => {
  const status = useSetupApiClients();
  if (status === "pending") {
    return <CenterLoader />;
  }
  if (status === "error") {
    return <Alert severity="error">Unable to prepare the API clients. Reload to retry.</Alert>;
  }
  return children;
};
