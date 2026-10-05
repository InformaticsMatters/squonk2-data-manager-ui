import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { type GetServerSideProps } from "next";

import { withPublicPagePolicy } from "../application/pagePolicy";
import { motdQueryKey } from "../components/Motd";
import HomeContent from "../content/index.mdx";
import { readActiveMotd } from "./api/motd";

// The messages of the day are answered with the page, so they are painted with it rather than
// pushing Home down once a read lands.
export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    motdQueryKey,
    await readActiveMotd().catch((error: unknown) => {
      captureException(error);
      return [];
    }),
  );
  return { props: { dehydratedState: dehydrate(queryClient) } };
};

export default withPublicPagePolicy(HomeContent);
