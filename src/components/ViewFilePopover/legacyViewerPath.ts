/**
 * The path spelling the standalone viewer pages still read from their own query. They take a
 * project-root relative path, so the absolute path a Files row carries is converted here in one
 * place rather than at each viewer link. The viewers keep their own routes until they are migrated
 * to the project workspace, and this is the only thing that bridges the two spellings.
 */
export const legacyViewerPath = (path: string): string => (path === "/" ? "" : path.slice(1));
