import { type ServerResponse } from "node:http";

const MAX_REASON_PHRASE = 200;

// A reason phrase carries printable latin1 only: no control characters, no wider code points.
const FIRST_PRINTABLE = 32;
const DELETE_CHARACTER = 127;
const LAST_LATIN1 = 255;

/**
 * Reduces a message to what an HTTP status line can carry. Node writes `statusMessage` into the
 * status line verbatim and throws `ERR_INVALID_CHAR` for a newline or a character outside latin1,
 * which destroys the response instead of rendering the error page, so a message that arrived from
 * outside this application can never be trusted with it.
 */
const asReasonPhrase = (message: string, code: number) => {
  const phrase = Array.from(message, (character) => {
    const point = character.codePointAt(0) ?? 0;
    return point < FIRST_PRINTABLE || point === DELETE_CHARACTER || point > LAST_LATIN1
      ? " "
      : character;
  })
    .join("")
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_REASON_PHRASE);
  return phrase || `Request failed with status ${code}`;
};

export const createErrorProps = (res: ServerResponse, code: number, message: string) => {
  const statusCode = code;
  const statusMessage = asReasonPhrase(message, code);
  res.statusCode = statusCode;
  res.statusMessage = statusMessage;
  return { props: { statusCode, statusMessage } };
};

/**
 * How a rejected upstream transport reports itself. The status is the only status fact, and the
 * upstream message is diagnostic detail: it is reported to Sentry but never becomes the status line
 * or the browser's message, so the transport cannot relay upstream text to the page.
 */
export const describeTransportFailure = (
  response: { status: number; statusText: string },
  data: { message?: unknown } | null,
) => {
  const statusMessage = response.statusText || `Unable to fetch file (${response.status})`;
  const reported = typeof data?.message === "string" ? data.message.trim() : "";
  return { diagnostic: reported || statusMessage, statusMessage };
};
