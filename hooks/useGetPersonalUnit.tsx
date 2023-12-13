import { useGetUnits } from "@squonk/account-server-client/unit";

import { useKeycloakUser } from "./useKeycloakUser";

export const useGetPersonalUnit = (username?: string) => {
  const { user } = useKeycloakUser();
  return useGetUnits({
    query: {
      select: (units) =>
        units.units
          .find((orgUnit) => orgUnit.organisation.name === process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME)
          ?.units.find((unit) => unit.owner_id === (username ?? user.username)),
    },
  });
};
