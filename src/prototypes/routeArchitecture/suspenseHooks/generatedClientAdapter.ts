import { useSyncExternalStore } from "react";

import { type AxiosAdapter, AxiosError, type AxiosResponse } from "axios";

type TraceSnapshot = {
  projectRequests: number;
  productRequests: number;
  events: { id: number; text: string }[];
};

let snapshot: TraceSnapshot = { projectRequests: 0, productRequests: 0, events: [] };
const listeners = new Set<() => void>();

const publish = (next: TraceSnapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

const record = (kind: "product" | "project", event: string) => {
  publish({
    projectRequests: snapshot.projectRequests + (kind === "project" ? 1 : 0),
    productRequests: snapshot.productRequests + (kind === "product" ? 1 : 0),
    events: [...snapshot.events, { id: snapshot.events.length + 1, text: event }],
  });
};

const append = (event: string) =>
  publish({
    ...snapshot,
    events: [...snapshot.events, { id: snapshot.events.length + 1, text: event }],
  });
const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 450);
  });

const response = (config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});

const notFound = (config: Parameters<AxiosAdapter>[0]) => {
  const result = response(config, { error: "Not found" });
  result.status = 404;
  result.statusText = "Not Found";
  return new AxiosError("Not found", AxiosError.ERR_BAD_REQUEST, config, undefined, result);
};

const projectResponse = (projectId: string) => ({
  administrators: [],
  created: "2026-01-01T00:00:00Z",
  creator: "project-owner",
  editors: projectId === "alpha" ? ["current-user"] : [],
  name: projectId === "alpha" ? "Alpha screening" : "Beta compounds",
  observers: [],
  private: false,
  product_id: `product-${projectId}`,
  project_id: projectId,
  size: 0,
});

const productResponse = (projectId: string) => ({
  product: {
    organisation: {
      id: projectId === "alpha" ? "acme" : "globex",
      name: projectId === "alpha" ? "Acme Research" : "Globex Labs",
    },
    product: { id: `product-${projectId}` },
    unit: {
      id: projectId === "alpha" ? "chemistry" : "biology",
      name: projectId === "alpha" ? "Chemistry" : "Biology",
    },
  },
});

export const generatedClientAdapter: AxiosAdapter = async (config) => {
  const url = config.url ?? "";
  const projectPattern = /^\/project\/([^/]+)$/u;
  const productPattern = /^\/product\/product-([^/]+)$/u;
  const projectMatch = projectPattern.exec(url);
  const productMatch = productPattern.exec(url);

  if (projectMatch) {
    const projectId = projectMatch[1];
    record("project", `Project request started: ${projectId}`);
    await delay();
    if (projectId === "missing") {
      append("Project request returned 404");
      throw notFound(config);
    }
    append("Project request completed; product ID is now known");
    return response(config, projectResponse(projectId));
  }

  if (productMatch) {
    const projectId = productMatch[1];
    record("product", `Product request started: product-${projectId}`);
    await delay();
    append("Product request completed; organisation and unit are now known");
    return response(config, productResponse(projectId));
  }

  throw new Error(`Unexpected prototype request: ${url}`);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useRequestTrace = () =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
