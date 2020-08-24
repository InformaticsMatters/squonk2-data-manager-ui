export interface Project {
  editors: string[];
  name: string;
  owner: string;
  projectId: string;
}

export interface Dataset {
  datasetId: string;
  editors: string[];
  labels: string[];
  name: string;
  owner: string;
  projects: string[];
  published: string;
  source: string;
  type: string;
}
