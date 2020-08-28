/**
 * Singleton instance that implements Mini-Apps Data Tier API 0.1 with axios
 */
import axios, { AxiosRequestConfig } from 'axios';

import appSettings from '../app/appSettings';
import { PostDatasetArgs } from './apiTypes';

enum Endpoints {
  PROJECT = 'project',
  DATASET = 'dataset',
  LABEL = 'label',
}

export class APIService {
  protected token?: string;
  protected url: string;

  constructor(protected mock: boolean = false, useProxy: boolean = false) {
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
  protected getAuthHeaders(): AxiosRequestConfig {
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
  protected async _fetchAvailableProjects() {
    if (this.mock) {
      return this.getPromiseMockData('GET/project');
    }

    const response = await axios.get(`${this.url}/${Endpoints.PROJECT}`, this.getAuthHeaders());
    return response.data;
  }

  /**
   * Access the api endpoint for projects/project_id if mock is false otherwise return mocked data
   */
  protected async _fetchProjectDetails(projectId: string) {
    if (this.mock) {
      return this.getPromiseMockData('GET/project/project_id');
    }

    const response = await axios.get(
      `${this.url}/${Endpoints.PROJECT}/${projectId}`,
      this.getAuthHeaders(),
    );
    return response.data;
  }

  protected async _postNewProject(name: string) {
    const response = await axios.post(
      `${this.url}/${Endpoints.PROJECT}`,
      `name=${name}`,
      this.getAuthHeaders(),
    );
    return response.data;
  }

  /**
   * Access the api endpoint for projects if mock is false otherwise return mocked data
   */
  protected async _fetchOwedDatasets() {
    if (this.mock) {
      return this.getPromiseMockData('GET/dataset');
    }

    const response = await axios.get(`${this.url}/${Endpoints.DATASET}`, this.getAuthHeaders());
    return response.data;
  }

  /** Create new file on server
   * @param file the `File` object to be sent
   * @param MIMEType the MIME type of the file being sent. Currently only
   */
  protected async _postDataset(args: PostDatasetArgs) {
    const formData = new FormData();
    Object.entries(args).forEach(([key, value]) => formData.append(key, value));

    const response = await axios.post(
      `${this.url}/${Endpoints.DATASET}`,
      formData,
      this.getAuthHeaders(),
    );
    return response.data;
  }
}

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
  'GET/project/project_id': {
    datasets: [
      {
        datasetId: 'dataset-319bc63b-6534-439a-91e1-4cbd1f87fa46',
        editors: ['dlister'],
        labels: ['project-x', 'project-y'],
        name: 'alpine',
        owner: 'dlister',
        projects: ['project-cd1e6c92-81db-4e47-9834-4c1115e3b048'],
        published: '2020-01-20T18:32:00+00:00',
        source: 'alpine.sdf',
        type: 'chemical/x-mdl-sdfile',
      },
    ],
    editors: ['dlister'],
    name: 'project-x',
    owner: 'dlister',
    projectId: 'project-cd1e6c92-81db-4e47-9834-4c1115e3b048',
  },

  'GET/dataset': [
    {
      datasetId: 'dataset-319bc63b-6534-439a-91e1-4cbd1f87fa46',
      editors: ['dlister'],
      labels: ['project-x', 'project-y'],
      name: 'alpine',
      owner: 'dlister',
      projects: ['project-cd1e6c92-81db-4e47-9834-4c1115e3b048'],
      published: '2020-01-20T18:32:00+00:00',
      source: 'alpine.sdf',
      type: 'chemical/x-mdl-sdfile',
    },
  ],
};
