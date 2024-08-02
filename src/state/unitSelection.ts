import { type UnitAllDetail } from "@squonk/account-server-client";

import { atom, useAtom } from "jotai";

export const unitAtom = atom<UnitAllDetail | undefined>(undefined);

export const useSelectedUnit = () => useAtom(unitAtom);
