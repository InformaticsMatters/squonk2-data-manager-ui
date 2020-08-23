/**
 * Singleton instance that implements Mini-Apps Data Tier API 0.1 with axios
 */
import axios, { AxiosRequestConfig } from 'axios';

import appSettings from '../appSettings';
import { Project } from './apiTypes';

enum Endpoints {
  PROJECT = 'project',
  DATASET = 'dataset',
  LABEL = 'label',
}

class ApiService {
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
  public getToken() {
    return this.token;
  }

  /**
   * get the Auth headers required to make an axios request
   */
  private getAuthHeaders(): AxiosRequestConfig {
    return {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
    };
  }

  /**
   * Access the api endpoint for projects if mock is false
   */
  private async _fetchAvailableProjects() {
    if (this.mock) {
      return Promise.resolve(mockedData['GET/project']);
    }

    console.debug(this.getAuthHeaders());

    const response = await axios.get(`${this.url}/${Endpoints.PROJECT}`, this.getAuthHeaders());
    return response.data;
  }

  /**
   * Asynchronously get the projects the authenticated user has access to
   */
  public async getAvailableProjects(): Promise<Project[]> {
    const data = await this._fetchAvailableProjects();
    return data.map(({ project_id, ...rest }: any) => ({ projectId: project_id, ...rest }));
  }
}

export default new ApiService(false, true);

/* spell-checker: disable */
const mockedData = {
  'GET/project': [
    {
      editors: ['dlister'],
      name: 'project-x',
      owner: 'dlister',
      project_id: 'project-cd1e6c92-81db-4e47-9834-4c1115e3b048',
    },
  ],
};
