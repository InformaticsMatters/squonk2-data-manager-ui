const getBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type");

  if (
    contentType?.includes("application/pdf") ||
    contentType?.includes("application/octet-stream")
  ) {
    return response.blob();
  }

  const body = await response.text();
  if (!body) {
    return undefined;
  }
  if (contentType?.includes("application/json") || contentType?.includes("+json")) {
    return JSON.parse(body) as unknown;
  }
  return body;
};

export const createFetchRuntime = () => {
  let baseURL = "";

  return {
    setBaseURL: (url: string) => {
      baseURL = url.replace(/\/$/u, "");
    },
    getBaseURL: () => baseURL,
    request: async <T>(url: string, options?: RequestInit): Promise<T> => {
      const response = await fetch(`${baseURL}${url}`, options);
      const data = await getBody(response);

      return { data, status: response.status, headers: response.headers } as T;
    },
  };
};
