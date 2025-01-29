import { type PropsWithChildren, useState } from "react";

import { useGetProjectFile } from "@squonk/data-manager-client/project";

import { Button, Typography } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { type SDFViewerConfig } from "../../utils/api/sdfViewer";
import { ConfigEditor } from "./ConfigEditor";
import { SDFViewerData } from "./SDFViewerData";

export interface SDFViewerProps {
  project: string;
  path: string;
  file: string;
}

const getSchemaFileNameFromSDFFileName = (fname: string) => fname.slice(0, -4) + ".schema.json";

export const SDFViewer = ({ project, path, file }: SDFViewerProps) => {
  const schemaFilename = getSchemaFileNameFromSDFFileName(file);
  const {
    data: schema,
    error,
    isLoading,
  } = useGetProjectFile<any>(project, {
    path,
    file: schemaFilename,
  });

  const [isEditingConfig, setIsEditingConfig] = useState(true);
  const [config, setConfig] = useState<SDFViewerConfig | undefined>(undefined);

  if (error) {
    // handle error
    // SDF schema might not exist
    return null;
  }

  if (isLoading) {
    // TODO: add loading page
    return (
      <Header title={file}>
        <CenterLoader />
      </Header>
    );
  }

  if (isEditingConfig || config === undefined) {
    return (
      <Header title={file}>
        <ConfigEditor
          config={config ?? {}}
          schema={schema}
          onChange={(config) => {
            setIsEditingConfig(false);
            setConfig(config);
          }}
        />
      </Header>
    );
  }

  return (
    <Header title={file}>
      <Button onClick={() => setIsEditingConfig(true)}>Edit</Button>
      <SDFViewerData config={config} file={file} path={path} project={project} />
    </Header>
  );
};

interface HeaderProps {
  title: string;
}

const Header = ({ title, children }: PropsWithChildren<HeaderProps>) => {
  return (
    <>
      <Typography gutterBottom variant="h1">
        {title}
      </Typography>
      {children}
    </>
  );
};
