import { nullEmptyString } from "../text";

/**
 * How a rejected request accounts for itself. Both specs document exactly one error schema, whose
 * `error` is "brief error text that can be presented to the user", but Connexion request-validation
 * and framework failures bypass the handler and answer `application/problem+json` — `type`,
 * `title`, `detail`, `status` — a shape neither spec documents and which never carries `error`.
 * Both arrive routinely, so both are read here and nowhere else.
 */
type ErrorBody = { detail?: unknown; error?: unknown; title?: unknown };

/** What a failure carries around the body: the transport's own account, which is not the service's. */
type FailureEnvelope = { message?: unknown; response?: { statusText?: unknown } };

/**
 * What is returned when an error carried no account of itself at all. It is a placeholder rather
 * than a message, so a caller composing its own sentence can tell it apart from real words.
 */
export const noErrorInformation = "Error: no information provided";

/**
 * The body an answer carried, whether it arrived through Axios, generated Fetch, or on its own. The
 * Fetch envelope is understood for the same reason `classifyTransportFailure` understands it: the
 * transport is generated but disabled, and both readings of a failure have to survive it coming
 * back.
 */
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

/** The named fields of a body, or none of them where the answer had no object to read. */
const fieldsOf = (body: unknown): ErrorBody =>
  typeof body === "object" && body !== null ? body : {};

/** One field as words a person can be shown, or `null` when it held nothing but whitespace. */
const readString = (value: unknown): string | null =>
  typeof value === "string" ? (nullEmptyString(value.trim()) ?? null) : null;

/**
 * The first useful sentence of a `detail`. Its quality runs from excellent (`'z' is too short -
 * 'name'`) to a JSON Schema dump of a few hundred characters, and the dump is that same sentence
 * followed by the schema it was validated against: jsonschema formats a validation error as
 * `f"{self.message}\n\nFailed validating ..."`, so the blank line is where the words a caller can
 * act on end. What survives is stated on one line, because that is how a snackbar renders it anyway.
 */
const firstSentenceOf = (detail: string) => {
  const [sentence = ""] = detail.split(/\n[^\S\n]*\n/u);
  return readString(sentence.replace(/\s+/gu, " "));
};

const trailingParenthetical = /\s*\((?:[^()]|\([^()]*\))*\)$/u;
const sentenceBreak = /[.!?]\s+[A-Z]/u;

/**
 * What the body said, before the part of it that was never meant for a caller is dropped.
 */
const accountIn = (body: unknown): string | null => {
  if (typeof body === "string") {
    return readString(body);
  }
  const { detail, error } = fieldsOf(body);

  return readString(error) ?? (typeof detail === "string" ? firstSentenceOf(detail) : null);
};

/**
 * A sentence without the trailing parenthetical the services append when the failure came from
 * somewhere else. Live, `POST /project` answers `The Product or its Unit does not support public
 * Projects (Action denied (-2). Failed to get a response from the Account Server (Got status 404,
 * expected 201))`: a complete sentence for the caller, then the call chain behind it, which names a
 * service the caller never addressed and a status they cannot act on.
 *
 * Only a parenthetical that starts a second sentence is read as that call chain, because the services
 * also end a perfectly good sentence with the subject it is about — `Not an editor (odudgeon)`, `The
 * file does not exist (/, zzz.txt)` — and those are the useful half of what they said. A new
 * sentence is a full stop followed by a capital, so an abbreviation inside one sentence does not read
 * as two. One level of nesting is understood, which is what the observed diagnostics carry; anything
 * deeper is left alone rather than cut at the wrong place.
 *
 * An answer that is nothing *but* such a parenthetical keeps it, because dropping it would leave the
 * caller with no account of the failure at all when the service did give one — and because
 * `classifyTransportFailure` reads this same text to tell a refused token from a refused resource.
 */
const withoutDiagnostics = (reason: string): string => {
  const clause = reason.replace(trailingParenthetical, (parenthetical) =>
    sentenceBreak.test(parenthetical) ? "" : parenthetical,
  );
  return clause.trim() === "" ? reason : clause;
};

/** The service's own account of a body, or `null` where the body held none. */
const reasonIn = (body: unknown): string | null => {
  const said = accountIn(body);
  return said === null ? null : readString(withoutDiagnostics(said));
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
export const apiFailureReason = (error: unknown): string | null => reasonIn(bodyOf(error));

/**
 * The whole sentence to show a person about a failure, for a caller that has no words of its own.
 *
 * The service's account comes first. After it there is nothing left but the reason phrase — `title`
 * and `statusText` are the same HTTP words, whichever end of the answer they arrived on — then the
 * transport's own message, and finally a placeholder, so this always says something. `null` means
 * no error was supplied at all, which is not a failure to describe.
 */
export const getErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }

  const body = bodyOf(error);
  const envelope = error as FailureEnvelope;

  return (
    reasonIn(body) ??
    readString(fieldsOf(body).title) ??
    readString(envelope.response?.statusText) ??
    readString(envelope.message) ??
    noErrorInformation
  );
};
