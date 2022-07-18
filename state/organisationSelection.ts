import type { OrganisationDetail } from "@squonk/account-server-client";

import { atom, useAtom } from "jotai";

export const organisationAtom = atom<OrganisationDetail | undefined>(undefined);

export const useSelectedOrganisation = () => useAtom(organisationAtom);
