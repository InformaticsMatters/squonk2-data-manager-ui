import { type UnitAllDetail } from "@/api/account-server";

import { atom, useAtom } from "jotai";

export const unitAtom = atom<UnitAllDetail | undefined>(undefined);

export const useSelectedUnit = () => useAtom(unitAtom);
