// ! VERSION 2.0.0

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

export enum MIMETypes {
  SDF = 'chemical/x-mdl-sdfile',
  PDB = 'chemical/x-pdb',
}

export type AllowedMIMETypes = MIMETypes;

export enum AllowedMediaTypes {
  SCHEMA = 'application/schema+json',
  JSON = 'application/x-squonk-dataset-molecule-v2+json',
}

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

export interface IMMolecule {
  uuid: string;
  molecule: {
    name: string;
    molblock?: string;
  };
  values: {
    [field: string]: string;
  };
}
