import { useState } from "react";

import { getGetFilesQueryKey } from "@/api/data-manager/file-and-path";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type InputData } from "../../../projects/runLaunchForm";
import { AppScaffold } from "../../../stories/decorators";
import { JobInputFields } from "./JobInputFields";

const projectId = "project-44444444-4444-4444-4444-444444444444";

const listing = (path: string, paths: string[], fileNames: string[]) => ({
  count: fileNames.length,
  files: fileNames.map((file_name) => ({
    file_name,
    owner: "user",
    stat: { modified: "2026-01-01T00:00:00Z", size: 1 },
  })),
  path,
  paths,
  project_id: projectId,
});

const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
client.setQueryData(
  getGetFilesQueryKey({ project_id: projectId, path: "/" }),
  listing("/", ["ligands"], ["root.sdf"]),
);
client.setQueryData(
  getGetFilesQueryKey({ project_id: projectId, path: "/ligands" }),
  listing("/ligands", [], ["a.sdf"]),
);

/** A job with two file inputs, over a project holding one sub-directory. */
export const TwoFileInputs = () => {
  const [inputsData, setInputsData] = useState<InputData>({});
  return (
    <AppScaffold>
      <QueryClientProvider client={client}>
        <JobInputFields
          inputs={{
            properties: {
              ligands: { title: "Ligands", type: "file" },
              protein: { title: "Protein", type: "file" },
            },
          }}
          inputsData={inputsData}
          projectId={projectId}
          onChange={setInputsData}
        />
      </QueryClientProvider>
    </AppScaffold>
  );
};
