import { type Response as NFResponse } from "node-fetch";

/** JSON itself, and the suffixed types that are also JSON, with or without parameters after them. */
const jsonMediaType = /^\s*application\/(?:[\w.+-]+\+)?json\s*(?:;|$)/iu;

/**
 * Whether an answer carried JSON, and so whether it can be read for what the service said.
 *
 * The suffixed form counts as much as the base type: Connexion request-validation and framework
 * rejections answer `application/problem+json`, and that is the only shape the `detail` carrying
 * their reason ever arrives in, so reading the base type alone loses every validation rejection.
 */
export const isResponseJson = (response: NFResponse | Response) =>
  jsonMediaType.test(response.headers.get("content-type") ?? "");
