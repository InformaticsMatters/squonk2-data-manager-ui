class ApiService {
  token?: string;

  setToken(token: string) {
    this.token = token;
  }
}

export default new ApiService();
