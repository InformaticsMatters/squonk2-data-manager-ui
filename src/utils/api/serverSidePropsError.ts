import { type ServerResponse } from "node:http";

import { apiFailureReason } from "../next/orvalError";

const MAX_REASON_PHRASE_LENGTH = 200;

// A reason phrase carries printable latin1 only: no control characters, no wider code points.
const FIRST_PRINTABLE = 32;
const DELETE_CHARACTER = 127;
const LAST_LATIN1 = 255;

/**
 * Reduces a message to what an HTTP status line can carry, or to nothing where it carried no words
 * at all. Node writes `statusMessage` into the status line verbatim and throws `ERR_INVALID_CHAR`
 * for a newline or a character outside latin1, which destroys the response instead of rendering the
 * error page, so a message that arrived from outside this application can never be trusted with it.
 */
const asReasonPhrase = (message: string) =>
  Array.from(message, (character) => {
    const point = character.codePointAt(0) ?? 0;
    return point < FIRST_PRINTABLE || point === DELETE_CHARACTER || point > LAST_LATIN1
      ? " "
      : character;
  })
    .join("")
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_REASON_PHRASE_LENGTH);

/**
 * How a server-rendered page reports the failure it is answering, in the response and in its own
 * props.
 *
 * The status line always carries a phrase, because a status line has to. The props carry only what
 * was actually said about this failure and are empty where nothing was, so a page can tell a real
 * account apart from a phrase invented to fill the line, and answer for the second in its own words
 * rather than showing a caller `Request failed with status 404`.
 */
export const createErrorProps = (res: ServerResponse, code: number, message: string) => {
  const statusMessage = asReasonPhrase(message);
  res.statusCode = code;
  res.statusMessage = statusMessage || `Request failed with status ${code}`;
  return { props: { statusCode: code, statusMessage } };
};

/**
 * How a rejected upstream transport reports itself: the service's own reason, for the page and for
 * Sentry alike.
 *
 * The reason is read out of the body through the one extractor over both shapes these services
 * answer with, and it is the whole of what is relayed. The reason phrase is named here and
 * deliberately never read: over HTTP/1.1 it is the generic phrase for the status, and over HTTP/2 —
 * which the Data Manager is served over — there is no reason phrase at all, so relaying it reports
 * `Not Found` for a body that said `File does not exist (/nope.txt)`, or reports nothing whatsoever.
 *
 * The reason arrived from outside this application, so it reaches a status line only through
 * `createErrorProps`, which is what makes it safe to write there.
 */
export const describeTransportFailure = (
  response: { status: number; statusText: string },
  data: unknown,
) => {
  // The body is handed to the extractor in the envelope it reads a body from, so a body that is a
  // plain string is read as the whole of what was said rather than skipped for lacking fields.
  const reason = apiFailureReason({ data });
  return {
    diagnostic: reason ?? `no reason in the ${response.status} body`,
    statusMessage: reason ?? "",
  };
};
