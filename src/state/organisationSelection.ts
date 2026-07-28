import { type OrganisationDetail } from "@/api/account-server";

import { atom, useAtom } from "jotai";

export const organisationAtom = atom<OrganisationDetail | undefined>(undefined);

export const useSelectedOrganisation = () => useAtom(organisationAtom);
