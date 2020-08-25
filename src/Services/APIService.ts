/**
 * Singleton instance that implements Mini-Apps Data Tier API 0.1 with axios
 */
import axios, { AxiosRequestConfig } from 'axios';

import appSettings from '../app/appSettings';
import { Dataset, Project } from './apiTypes';

enum Endpoints {
  PROJECT = 'project',
  DATASET = 'dataset',
  LABEL = 'label',
}

class APIService {
  private token?: string;
  private url: string;

  constructor(private mock: boolean = false, useProxy: boolean = false) {
    if (useProxy) {
      this.url = 'https://cors-anywhere.herokuapp.com/' + appSettings.DATA_TIER_SERVER;
    } else {
      this.url = appSettings.DATA_TIER_SERVER;
    }
  }

  /**
   * Sets the keycloak token required to make API calls
   * @param token Main keycloak token sent in API calls
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * getToken gets the stored keycloak token
   */
  getToken() {
    return this.token;
  }

  /**
   * removeToken sets the token back to undefined
   */
  removeToken() {
    this.token = undefined;
  }

  /**
   * hasToken check whether service has a token
   */
  hasToken() {
    return this.token !== undefined;
  }

  /**
   * get the Auth headers required to make an axios request
   */
  private getAuthHeaders(): AxiosRequestConfig {
    return {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
    };
  }

  getPromiseMockData(key: string) {
    return Promise.resolve(mockedData[key]);
  }

  /**
   * Access the api endpoint for projects if mock is false
   */
  private async _fetchAvailableProjects() {
    if (this.mock) {
      return this.getPromiseMockData('GET/project');
    }

    const response = await axios.get(`${this.url}/${Endpoints.PROJECT}`, this.getAuthHeaders());
    return response.data;
  }

  /**
   * Asynchronously get the projects the authenticated user has access to
   */
  async getAvailableProjects(): Promise<Project[]> {
    const data = await this._fetchAvailableProjects();
    return data.map(({ project_id, ...rest }: any) => ({ projectId: project_id, ...rest }));
  }

  /**
   * Access the api endpoint for projects/project_id if mock is false otherwise return mocked data
   */
  private async _fetchProjectDetails(projectId: string) {
    if (this.mock) {
      return this.getPromiseMockData('GET/project/project_id');
    }

    const response = await axios.get(
      `${this.url}/${Endpoints.PROJECT}/${projectId}`,
      this.getAuthHeaders(),
    );
    return response.data;
  }

  /**
   * Asynchronously get all the datasets for the specified project id
   * @param projectId the `project_id` for the project to fetch the datasets of
   */
  async getDatasetsFromProject(projectId: string): Promise<Dataset[]> {
    const data = await this._fetchProjectDetails(projectId);
    return data.datasets;
  }

  private async _postNewProject(name: string) {
    const response = await axios.post(
      `${this.url}/${Endpoints.PROJECT}`,
      `name=${name}`,
      this.getAuthHeaders(),
    );
    return response.data;
  }

  /**
   * Asynchronously add a new project with the provided name
   * @param name the name of the new project
   */
  createNewProject(name: string) {
    return this._postNewProject(name);
  }

  /**
   * Access the api endpoint for projects if mock is false otherwise return mocked data
   */
  private async _fetchOwedDatasets() {
    if (this.mock) {
      return this.getPromiseMockData('GET/dataset');
    }

    const response = await axios.get(`${this.url}/${Endpoints.DATASET}`, this.getAuthHeaders());
    return response.data;
  }

  /**
   * Asynchronously get all the datasets the user has access to
   */
  async getOwnedDatasets(): Promise<Dataset[]> {
    const data = await this._fetchOwedDatasets();
    return data.map(({ dataset_id, ...rest }: any) => ({ datasetId: dataset_id, ...rest }));
  }
}

export default new APIService(false, false);

/* spell-checker: disable */
const mockedData: any = {
  'GET/project': [
    {
      editors: ['dlister'],
      name: 'project-x',
      owner: 'dlister',
      projectId: 'project-cd1e6c92-81db-4e47-9834-4c1115e3b048',
    },
  ],
  'GET/project/project_id': [
    {
      datasets: [],
      editors: ['dlister'],
      name: 'project-x',
      owner: 'dlister',
      project_id: 'project-cd1e6c92-81db-4e47-9834-4c1115e3b048',
    },
  ],
  'GET/dataset': [
    {
      datasetId: 'dataset-319bc63b-6534-439a-91e1-4cbd1f87fa46',
      editors: ['dlister'],
      labels: ['project-x'],
      name: 'alpine',
      owner: 'dlister',
      projects: ['project-cd1e6c92-81db-4e47-9834-4c1115e3b048'],
      published: '2020-01-20T18:32:00+00:00',
      source: 'alpine.sdf',
      type: 'chemical/x-mdl-sdfile',
    },
  ],
};
