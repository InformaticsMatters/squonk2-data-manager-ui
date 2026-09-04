import { captureException } from "@sentry/nextjs";
import { fromNodeHeaders } from "better-auth/node";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import fetch from "node-fetch";

import { auth } from "../../lib/auth";
import { isResponseJson } from "./fetchHelpers";
import { createErrorProps, describeTransportFailure } from "./serverSidePropsError";

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

/**
 * Asks the Data Manager for one resource as the signed-in caller. Every server-rendered viewer and
 * every probe of one goes through here, so a resource is fetched with the caller's own authority
 * and a rejection is reported the same way however the answer was going to be used.
 */
const fetchAsCaller = async (
  req: Request,
  res: ServerResponse,
  url: string,
): Promise<
  { failure: { props: NotSuccessful } } | { response: Awaited<ReturnType<typeof fetch>> }
> => {
  let accessToken;
  try {
    const result = await auth.api.getAccessToken({
      body: { useAccountCookie: true },
      headers: fromNodeHeaders(req.headers),
    });
    accessToken = result.accessToken;
  } catch (error) {
    captureException(error);
    return { failure: createErrorProps(res, 500, "Unable to authenticate user server side") };
  }

  let response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (error) {
    captureException(error);
    return {
      failure: createErrorProps(
        res,
        500,
        "Unable to fetch file due to a network error. Try again.",
      ),
    };
  }

  if (!response.ok) {
    const isJson = isResponseJson(response);
    const data = isJson ? ((await response.json()) as { message?: unknown } | null) : null;
    // The response status is the only status fact. A message is diagnostic detail, never a status.
    const { diagnostic, statusMessage } = describeTransportFailure(response, data);
    captureException(new Error(`Unable to fetch file (${response.status}): ${diagnostic}`));
    return { failure: createErrorProps(res, response.status, statusMessage) };
  }

  return { response };
};

/**
 * Whether the caller may read this resource at all, without delivering it. A viewer that fetches
 * the bytes itself — in the browser, or through the parser — still has to be told that the file is
 * there and readable before it is framed, and this answers that on exactly the same terms the
 * server-rendered viewer is answered on: `null` means readable, anything else is the transport's
 * own refusal.
 */
export const probeViewerResource = async (
  req: Request,
  res: ServerResponse,
  { url }: { url: string },
): Promise<NotSuccessful | null> => {
  const result = await fetchAsCaller(req, res, url);
  if ("failure" in result) {
    return result.failure.props;
  }
  // Nothing is read from a resource that only had to answer, so the connection is released rather
  // than streamed to its end.
  const body = result.response.body;
  if (body instanceof Readable) {
    body.destroy();
  }
  return null;
};

export const plaintextViewerSSR = async (
  req: Request,
  res: ServerResponse,
  { url, compressed }: SSRArguments,
) => {
  const result = await fetchAsCaller(req, res, url);
  if ("failure" in result) {
    return result.failure;
  }
  const { response } = result;

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
