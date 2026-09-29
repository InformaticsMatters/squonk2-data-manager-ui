import { useGetPersonalUnit as useGetPersonalUnitResource } from "@/api/account-server/unit";

/**
 * Resolves the caller's personal unit from its own generated resource. Personal units are not
 * identified by organisation or unit naming conventions; the Account Server owns that meaning and
 * answers `404` when the caller has none.
 */
export const useGetPersonalUnit = () => useGetPersonalUnitResource({ query: { retry: false } });
