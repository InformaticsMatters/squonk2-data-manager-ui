import { type PropsWithChildren, useState } from "react";

import { Button, Typography } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { type SDFViewerConfig } from "../../utils/api/sdfViewer";
import { ConfigEditor } from "./ConfigEditor";
import { SDFViewerData } from "./SDFViewerData";
import { useGetSDFSchema } from "./useGetSDFSchema";

export interface SDFViewerProps {
  project: string;
  path: string;
  file: string;
}

export const SDFViewer = ({ project, path, file }: SDFViewerProps) => {
  const { schema, isLoading } = useGetSDFSchema(project, path, file);

  const [isEditingConfig, setIsEditingConfig] = useState(true);
  const [config, setConfig] = useState<SDFViewerConfig | undefined>(undefined);

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
