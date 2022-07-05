import { atom } from "jotai";

import { getFromLocalStorage, writeToLocalStorage } from "../localStorage";

export const atomWithLocalStorage = <TInitialValue>(key: string, initialValue: TInitialValue) => {
  const getInitialValue = () => getFromLocalStorage(key, initialValue);

  const baseAtom = atom(getInitialValue());

  const derivedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: TInitialValue) => {
      const nextValue = typeof update === "function" ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      writeToLocalStorage(key, nextValue);
    },
  );
  return derivedAtom;
};
