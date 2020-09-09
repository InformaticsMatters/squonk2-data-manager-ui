// ! VERSION 2.0.0

import { APIService } from './APIService';
import { AddNewDatasetArgs, AllowedMediaTypes, Dataset, IMMolecule, Project } from './apiTypes';

class DataTierAPI extends APIService {
  /**
   * Asynchronously get the projects the authenticated user has access to
   */
  async getAvailableProjects(): Promise<Project[]> {
    const data = await this._getAvailableProjects();
    return data.map(({ project_id, ...rest }: any) => ({ projectId: project_id, ...rest }));
  }

  /**
   * Asynchronously get all the datasets for the specified project id
   * @param projectId the `project_id` for the project to fetch the datasets of
   */
  async getDatasetsFromProject(projectId: string): Promise<Dataset[]> {
    const data = await this._getProjectDetails(projectId);
    return data.datasets.map(({ dataset_id, ...rest }: any) => ({
      datasetId: dataset_id,
      ...rest,
    }));
  }

  /**
   * Asynchronously get the metadata (available fields) of a dataset.
   * The data-tier endpoint currently only supports this for SDF files!
   * @param projectId the id of the project the file is a part of
   * @param datasetId the id of the dataset to get the metadata of
   */
  async getDatasetMetaFromProject(projectId: string, datasetId: string): Promise<any> {
    const schema = await this._getDatasetFromProject(
      projectId,
      datasetId,
      AllowedMediaTypes.SCHEMA,
    );
    return schema;
  }

  /**
   * Asynchronously get the parsed JSON version of a dataset
   * @param projectId the id of the project the file is a part of
   * @param datasetId the id of the dataset to get the metadata of
   */
  async downloadDatasetFromProjectAsJSON(
    projectId: string,
    datasetId: string,
  ): Promise<IMMolecule[]> {
    const streamReader = await this._getDatasetFromProject(
      projectId,
      datasetId,
      AllowedMediaTypes.JSON,
    );

    return streamReader as any; // ! Need to handle these streams
  }

  /**
   * Asynchronously get the native file format of a dataset.
   * @param projectId the `project_id` of the project that dataset is a part of
   * @param datasetId the `dataset_id` of the dataset whose native file with be fetched
   */
  async downloadDatasetFromProjectAsNative(projectId: string, datasetId: string) {
    const data = await this._getDatasetFromProject(projectId, datasetId);
    return await data?.blob();
  }

  /**
   * Asynchronously add a new project with the provided name
   * @param name the name of the new project
   */
  async createNewProject(name: string): Promise<string> {
    const { project_id } = await this._postNewProject(name);
    return project_id;
  }

  /**
   * Asynchronously get all the datasets the user has access to
   */
  async getOwnedDatasets(): Promise<Dataset[]> {
    const data = await this._getOwedDatasets();
    return data.map(({ dataset_id, ...rest }: any) => ({ datasetId: dataset_id, ...rest }));
  }

  /**
   * Asynchronously post a new data set
   * @param args object containing the `File` object, and MIME type.
   * A name can be provided, when it is `undefined` the `file.name` is used.
   * Optionally labels and projects can be provided
   */
  async uploadNewDataset({ file, MIMEType, name, ...rest }: AddNewDatasetArgs): Promise<string> {
    const { dataset_id } = await this._postDataset({
      datasetFile: file,
      datasetType: MIMEType,
      datasetName: name ?? file.name,
      ...rest,
    });
    return dataset_id;
  }

  /**
   * Asynchronously delete a dataset
   * @param datasetId the dataset_id of the dataset that is to be deleted. The user must have editor access.
   */
  deleteDataset(datasetId: string) {
    return this._deleteDataset(datasetId);
  }

  /**
   * Asynchronously put labels on an existing dataset. Labels are replaced not appended!
   * @param datasetId the dataset_id of the dataset with labels that will be replaced
   */
  replaceLabels(datasetId: string, newLabels: string[]) {
    return this._putLabels(datasetId, newLabels);
  }
}

export default new DataTierAPI(false, false);
