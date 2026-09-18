import { atom, useAtom } from "jotai";

/**
 * One favourited file or directory, identified by the project-root relative path a job input also
 * carries, so a favourite and a selection always name the same thing.
 */
export type FavouriteFile = { mimeType?: string; path: string; type: "directory" | "file" };

/** Favourites of every project the caller has visited, each project's own list under its own ID. */
export type FavouriteFileState = Record<string, FavouriteFile[] | undefined>;

const favouriteFilesAtom = atom<FavouriteFileState>({});

export const projectFavourites = (state: FavouriteFileState, projectId: string): FavouriteFile[] =>
  state[projectId] ?? [];

export const isFavouriteFile = (favourites: readonly FavouriteFile[], path: string): boolean =>
  favourites.some((favourite) => favourite.path === path);

/**
 * Adds or removes one favourite of one project. Every other project's list is left exactly as it
 * was, because a favourite belongs to the project its file belongs to and to no other.
 */
export const toggleFavouriteFile = (
  state: FavouriteFileState,
  projectId: string,
  file: FavouriteFile,
): FavouriteFileState => {
  const held = projectFavourites(state, projectId);
  return {
    ...state,
    [projectId]: isFavouriteFile(held, file.path)
      ? held.filter((favourite) => favourite.path !== file.path)
      : [...held, file],
  };
};

/**
 * The favourites of one named project. The project is always named by the caller — there is no
 * fallback to a selected or previously current project — so a favourite can never be read from, or
 * written to, a project other than the one whose files are on screen.
 */
export const useProjectFileFavourites = (projectId: string) => {
  const [state, setState] = useAtom(favouriteFilesAtom);
  const favourites = projectFavourites(state, projectId);

  return {
    favourites,
    isFavourite: (path: string) => isFavouriteFile(favourites, path),
    toggleFavourite: (file: FavouriteFile) =>
      setState((current) => toggleFavouriteFile(current, projectId, file)),
  };
};
