import { nullEmptyString } from "../text";

/**
 * How a rejected request accounts for itself. Both specs document exactly one error schema, whose
 * `error` is "brief error text that can be presented to the user", but Connexion request-validation
 * and framework failures bypass the handler and answer `application/problem+json` — `type`,
 * `title`, `detail`, `status` — a shape neither spec documents and which never carries `error`.
 * Both arrive routinely, so both are read here and nowhere else.
 */
type ErrorBody = { detail?: unknown; error?: unknown; title?: unknown };

/**
 * What is returned when an error carried no account of itself at all. It is a placeholder rather
 * than a message, so a caller composing its own sentence can tell it apart from real words.
 */
export const noErrorInformation = "Error: no information provided";

/** The body an answer carried, whether it arrived through Axios, generated Fetch, or on its own. */
const bodyOf = (error: unknown): unknown => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  const response: unknown = "response" in error ? error.response : undefined;
  if (typeof response === "object" && response !== null && "data" in response) {
    return response.data;
  }
  return "data" in error ? error.data : error;
};

/** One field as words a person can be shown, or `null` when it held nothing but whitespace. */
const readString = (value: unknown): string | null =>
  typeof value === "string" ? (nullEmptyString(value.trim()) ?? null) : null;

/**
 * The first useful sentence of a `detail`. Its quality runs from excellent (`'z' is too short -
 * 'name'`) to a JSON Schema dump of a few hundred characters, and the dump is the same sentence
 * followed by the schema it was validated against: jsonschema separates the two with a blank line,
 * so that is where the words a caller can act on end. What survives is stated on one line, because
 * that is how a snackbar renders it anyway.
 */
const firstSentenceOf = (detail: string) => {
  const [sentence = ""] = detail.split(/\n[^\S\n]*\n/u);
  return readString(sentence.replace(/\s+/gu, " "));
};

/**
 * The service's own account of why it rejected a request, or `null` when the answer carried none.
 *
 * `error` is what both services document and is therefore read first; `detail` is what the
 * framework sends in its place, and a body that is a plain string is the whole of what was said.
 * The reason phrase, the transport's own message, and the rest of the envelope are facts about the
 * request rather than an account of it, so they are not reported as the service's words: a caller
 * with a sentence of its own keeps that sentence instead of stating "Bad Request" to a person.
 */
export const apiFailureReason = (error: unknown): string | null => {
  const body = bodyOf(error);

  if (typeof body === "string") {
    return readString(body);
  }
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { detail, error: documented } = body as ErrorBody;

  return readString(documented) ?? (typeof detail === "string" ? firstSentenceOf(detail) : null);
};

/**
 * @param error the failure from which to extract a message that can be shown to a person
 * @returns the service's own account of the failure, falling back through the reason phrase and the
 *          transport's own words to a placeholder, or `null` when no error was supplied
 */
export const getErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }

  const body = bodyOf(error);
  const title =
    typeof body === "object" && body !== null ? readString((body as ErrorBody).title) : null;
  const envelope = error as { message?: unknown; response?: { statusText?: unknown } };

  return (
    apiFailureReason(error) ??
    title ??
    readString(envelope.response?.statusText) ??
    readString(envelope.message) ??
    noErrorInformation
  );
};
