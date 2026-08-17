import { type IncomingMessage, type ServerResponse } from "node:http";

import { getScenario, type RequestRecord } from "./state";

/**
 * What every fixture service does the same way: read a request, answer it, and record that it was
 * asked. Nothing here knows which service it is serving, so a test can assert on the requests one
 * screen made without the four services having four ideas of what a request is.
 */

export const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
export const decodeSubject = (authorization: string | undefined) => {
  if (!authorization?.startsWith("Bearer ")) {
    return "anonymous";
  }
  const payload = authorization.slice(7).split(".")[1];
  if (!payload) {
    return "anonymous";
  }
  return (
    (JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string }).sub ??
    "anonymous"
  );
};

export const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
};

export const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};
export const cors = (request: IncomingMessage, response: ServerResponse) => {
  response.setHeader("access-control-allow-headers", "authorization,content-type");
  response.setHeader("access-control-allow-methods", "DELETE,GET,PATCH,POST,PUT,OPTIONS");
  response.setHeader("access-control-allow-origin", request.headers.origin ?? "*");
};
export const record = (request: IncomingMessage, url: URL) => {
  const authorization = request.headers.authorization;
  const subject = decodeSubject(authorization);
  const requestRecord: RequestRecord = {
    authorization,
    method: request.method ?? "GET",
    path: url.pathname,
    // Kept apart from the path so a test can state exactly which arguments a read was constrained
    // by without every other diagnostic having to know about them.
    query: url.search,
    subject,
  };
  getScenario(subject).requests.push(requestRecord);
  return { state: getScenario(subject), subject };
};

/**
 * One named field of a multipart body. An upload's destination is carried in the body rather than
 * the URL, so a test can only prove where a file landed if the fixture reads it from there too.
 */
export const multipartField = (body: string, name: string) => {
  const part = body
    .split(/--[^\r\n]+\r\n/u)
    .find((candidate) => candidate.includes(`name="${name}"`));
  return part?.split("\r\n\r\n")[1]?.replace(/\r\n$/u, "");
};
