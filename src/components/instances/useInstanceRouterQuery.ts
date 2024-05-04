import { useRouter } from "next/router";

export const useInstanceRouterQuery = () => {
  // Remove the parameter so it doesn't appear as a query parameter
  let { query } = useRouter();
  query = { ...query };
  delete query.instanceId;

  return query;
};
