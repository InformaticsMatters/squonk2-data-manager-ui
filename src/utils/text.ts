export const nullEmptyString = (str: string | null | undefined) => (str === "" ? null : str);

/**
 * A fragment ended as a sentence, so a service's own words can be followed by this client's without
 * the two running together. Anything already ended is left exactly as the service wrote it.
 */
export const asSentence = (text: string) => (".!?".includes(text.slice(-1)) ? text : `${text}.`);
