import { type PropsWithChildren, useState } from "react";

import { Button, Typography } from "@mui/material";

import { CenterLoader } from "../../components/CenterLoader";
import { filesystemFile } from "../../projects/fileFacts";
import { type SDFViewerConfig } from "../../utils/api/sdfViewer";
import { ConfigEditor } from "./ConfigEditor";
import { SDFViewerData } from "./SDFViewerData";
import { useGetSDFSchema } from "./useGetSDFSchema";

export interface SDFViewerProps {
  projectId: string;
  /** Absolute path of the file inside the project that owns it. */
  path: string;
}

export const SDFViewer = ({ projectId, path }: SDFViewerProps) => {
  const { schema, isLoading } = useGetSDFSchema(projectId, path);

  const [isEditingConfig, setIsEditingConfig] = useState(true);
  const [config, setConfig] = useState<SDFViewerConfig | undefined>(undefined);

  const title = filesystemFile(path)?.name ?? path;

  if (isLoading) {
    // TODO: add loading page
    return (
      <Header title={title}>
        <CenterLoader />
      </Header>
    );
  }

  if (isEditingConfig || config === undefined) {
    return (
      <Header title={title}>
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
    <Header title={title}>
      <Button onClick={() => setIsEditingConfig(true)}>Edit</Button>
      <SDFViewerData config={config} path={path} projectId={projectId} />
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
