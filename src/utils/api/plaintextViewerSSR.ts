import { captureException } from "@sentry/nextjs";
import { fromNodeHeaders } from "better-auth/node";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { createGunzip } from "node:zlib";
import fetch from "node-fetch";

import { auth } from "../../lib/auth";
import { isResponseJson } from "./fetchHelpers";
import { createErrorProps } from "./serverSidePropsError";

const MAX_BYTES = 100_000;

export interface Successful {
  /**
   * The file content to display. This is possibly truncated to the nearest line.
   */
  content: string;
  /**
   * The value of the content-length header
   */
  originalContentLength: number | null;
  /**
   * Whether the stream has been truncated
   */
  truncated: boolean;
}

export interface NotSuccessful {
  /**
   * HTTP error code
   */
  statusCode: number;
  /**
   * Reason for the error
   */
  statusMessage: string;
}

export interface SSRArguments {
  /**
   * The URL endpoint from which the file is requested
   */
  url: string;
  /**
   * Whether the file is compressed
   */
  compressed: boolean;
}

// Copied from GetServerSideProps
type Request = IncomingMessage & { cookies: Partial<Record<string, string>> };

export const plaintextViewerSSR = async (
  req: Request,
  res: ServerResponse,
  { url, compressed }: SSRArguments,
) => {
  let accessToken;
  try {
    const result = await auth.api.getAccessToken({
      body: { providerId: "keycloak" },
      headers: fromNodeHeaders(req.headers),
    });
    accessToken = result.accessToken;
  } catch (error) {
    captureException(error);
    return createErrorProps(res, 500, "Unable to authenticate user server side");
  }

  let response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (error) {
    captureException(error);
    return createErrorProps(res, 500, "Unable to fetch file due to a network error. Try again.");
  }

  if (!response.ok) {
    const isJson = isResponseJson(response);
    const data = isJson ? ((await response.json()) as { message?: unknown } | null) : null;
    const reported = typeof data?.message === "string" ? data.message : response.statusText;
    const message = reported || `The request failed with status ${response.status}`;
    // The response status is the only status fact. A message is diagnostic detail, never a status.
    captureException(new Error(`Unable to fetch file (${response.status}): ${message}`));
    return createErrorProps(res, response.status, message);
  }

  // We use `node-fetch` which supports streaming unlike NextJS's fetch as of v12.2
  let stream = response.body;

  if (stream === null) {
    captureException("Unable to create stream from file response. `response.body` was `null`");
    return createErrorProps(res, 500, "Unable to create stream from file response");
  }

  // Count the bytes before decompression (even when the file isn't compressed)
  let compressedBytes = 0;
  stream.on("data", (chunk) => (compressedBytes += Buffer.from(chunk).byteLength));

  if (compressed) {
    try {
      stream = stream.pipe(createGunzip());
    } catch (error) {
      console.error(error);
      return createErrorProps(res, 500, "Gzip stream error");
    }
  }

  // Count the number of bytes after decompression (this could be the same as compressedBytes)
  let uncompressedBytes = 0;
  let content = "";
  try {
    for await (const chunk of stream) {
      content += chunk.toString();
      uncompressedBytes += Buffer.from(chunk).byteLength;

      // Stop streaming chunks when we have enough
      // This is based on the decompressed size as that's what will be sent to the client
      if (uncompressedBytes >= MAX_BYTES) {
        break;
      }
    }
  } catch (error) {
    captureException(error);
    console.error(error);
    return createErrorProps(res, 500, "Streaming error");
  }

  // Ensure last line of content is a full line
  if (!content.endsWith("\n")) {
    const pos = content.lastIndexOf("\n");
    if (pos !== -1) {
      content = content.slice(0, pos);
    }
  }

  // If the header is missing this becomes `NaN` and then this value is serialised as `null`
  const originalContentLength = Number(response.headers.get("content-length"));

  return {
    props: {
      content,
      originalContentLength,
      truncated: compressed
        ? compressedBytes < originalContentLength
        : uncompressedBytes < originalContentLength,
    },
  };
};
