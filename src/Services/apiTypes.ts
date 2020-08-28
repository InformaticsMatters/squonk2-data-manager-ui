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

interface BasePostDataset {
  labels?: string[];
  projects?: string[];
}

type AllowedMIMETypes = 'chemical/x-mdl-sdfile' | 'chemical/x-pdb';

export interface PostDatasetArgs extends BasePostDataset {
  datasetFile: File;
  datasetName: string;
  datasetType?: AllowedMIMETypes;
}

export interface AddNewDatasetArgs extends BasePostDataset {
  file: File;
  MIMEType: AllowedMIMETypes;
  name?: string;
}
