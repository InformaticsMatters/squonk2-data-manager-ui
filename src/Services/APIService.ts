/**
 * ! VERSION 2.0.0
 */

import appSettings from '../app/appSettings';
import { AllowedMediaTypes, PostDatasetArgs } from './apiTypes';

enum Endpoints {
  PROJECT = 'project',
  DATASET = 'dataset',
  LABEL = 'label',
}

enum ErrorMessages {
  NOT_FOUND = `The requested resource couldn't be found`,
  NOT_AUTHORISED = `The server believe you are not authorized. Try to logout and log back in.`,
  UNKNOWN = 'An unknown error occurred',
}

type QueryParam = string | number | boolean;

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
   * get the Auth header required to make an axios request
   */
  private getAuthHeaders() {
    return { Authorization: `Bearer ${this.token}` };
  }

  private getPromiseMockData(key: string) {
    return Promise.resolve(mockedData[key]);
  }

  private handleError(status: number) {
    switch (status) {
      case 401:
        throw new Error(ErrorMessages.NOT_AUTHORISED);
      case 403:
        throw new Error(ErrorMessages.NOT_AUTHORISED);
      case 404:
        throw new Error(ErrorMessages.NOT_FOUND);
      default:
        throw new Error(ErrorMessages.UNKNOWN);
    }
  }

  /**
   * Access the api endpoint for projects if mock is false
   */
  protected async _getAvailableProjects() {
    if (this.mock) {
      return this.getPromiseMockData('GET/project');
    }

    const response = await fetch(`${this.url}/${Endpoints.PROJECT}`, {
      headers: this.getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }

    this.handleError(response.status);
  }

  /**
   * Access the GET api endpoint for projects/project_id if mock is false otherwise return mocked data
   */
  protected async _getProjectDetails(projectId: string) {
    if (this.mock) {
      return this.getPromiseMockData('GET/project/project_id');
    }

    const response = await fetch(`${this.url}/${Endpoints.PROJECT}/${projectId}`, {
      headers: this.getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }

    this.handleError(response.status);
  }

  /**
   * Access the POST api endpoint for projects
   * @param name the name of the project that will be created
   */
  protected async _postNewProject(name: string) {
    const formData = new FormData();
    formData.append('name', name);

    const response = await fetch(`${this.url}/${Endpoints.PROJECT}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }

    this.handleError(response.status);
  }

  /**
   * Access the api endpoint for projects if mock is false otherwise return mocked data
   */
  protected async _getOwedDatasets() {
    if (this.mock) {
      return this.getPromiseMockData('GET/dataset');
    }

    const response = await fetch(`${this.url}/${Endpoints.DATASET}`, {
      headers: this.getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }

    this.handleError(response.status);
  }

  private paramIsUndefined(param: unknown): param is [string, QueryParam] {
    const p = param as [string, QueryParam];
    return p[1] !== undefined;
  }

  private encodeParams(params: { [key: string]: QueryParam | undefined }): string {
    return Object.entries(params)
      .filter(this.paramIsUndefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Fetch a dataset, file or metadata, with given id from a project with given project id.
   * @param projectId the id of the project which the dataset is a part of
   * @param datasetId the id of the dataset to be requested
   * @param mediaType the type of response requested
   *
   * @returns the Response object. This is so it can be handled in the way the application requires.
   * E.g. as a stream, directly to JSON (not recommended) or to a Blob.
   */
  protected async _getDatasetFromProject(
    projectId: string,
    datasetId: string,
    mediaType?: AllowedMediaTypes,
  ) {
    const url = `${this.url}/${Endpoints.PROJECT}/${projectId}/${
      Endpoints.DATASET
    }/${datasetId}?${this.encodeParams({ format: mediaType })}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (response.ok) {
      return response;
    }

    this.handleError(response.status);
  }

  /** Create new file on server
   * @param file the `File` object to be sent
   * @param MIMEType the MIME type of the file being sent.
   */
  protected async _postDataset(args: PostDatasetArgs) {
    const formData = new FormData();
    Object.entries(args).forEach(([key, value]) => formData.append(key, value));

    const response = await fetch(`${this.url}/${Endpoints.DATASET}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    }

    this.handleError(response.status);
  }

  /**
   * Access the DELETE api endpoint for `dataset/dataset_id`
   * @param datasetId the `dataset_id` that will be requested for deletion
   */
  protected async _deleteDataset(datasetId: string) {
    const response = await fetch(`${this.url}/${Endpoints.DATASET}/${datasetId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      this.handleError(response.status);
    }
  }

  /**
   * Access the PUT api endpoint for `label/dataset_id`
   * @param datasetId the dataset from which the labels will be replaced by the new labels
   * @param newLabels the new labels that replace the old ones
   */
  protected async _putLabels(datasetId: string, newLabels: string[]) {
    const formData = new FormData();
    formData.append('labels', newLabels.join(','));
    const response = await fetch(`${this.url}/${Endpoints.LABEL}/${datasetId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      this.handleError(response.status);
    }
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
