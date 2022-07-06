import type { UnitDetail } from "@squonk/account-server-client";

import { atom, useAtom } from "jotai";

export const unitAtom = atom<UnitDetail | undefined>(undefined);

export const useSelectedUnit = () => useAtom(unitAtom);
