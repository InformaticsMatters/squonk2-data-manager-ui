import { atom, useAtom } from "jotai";

export const isASketcherOpen = atom(false);

export const useIsASketcherOpen = () => useAtom(isASketcherOpen);
