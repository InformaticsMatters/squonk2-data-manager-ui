import { getGetInstancesQueryKey, getInstances } from "@squonk/data-manager-client/instance";
import { getGetTasksQueryKey, getTasks } from "@squonk/data-manager-client/task";

import {
  getAccessToken,
  withPageAuthRequired as withPageAuthRequiredSSR,
} from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import NextError from "next/error";
import Head from "next/head";
import type { GetServerSideProps } from "nextjs-routes";

import { RoleRequired } from "../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { ResultsView } from "../features/ResultsView";
import Layout from "../layouts/Layout";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { dmOptions } from "../utils/api/ssrQueryOptions";
import type { NotSuccessful, ReactQueryPageProps } from "../utils/next/ssr";
import { getFullReturnTo } from "../utils/next/ssr";

export type ResultsProps = NotSuccessful | ReactQueryPageProps;
const isNotSuccessful = (props: ResultsProps): props is NotSuccessful => {
  return typeof (props as NotSuccessful).statusCode === "number";
};

export const getServerSideProps: GetServerSideProps<ResultsProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<ResultsProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
      const projectId = query.project;

      if (Array.isArray(projectId)) {
        return createErrorProps(res, 400, "Project can't be an array");
      }

      const queryClient = new QueryClient();
      try {
        const { accessToken } = await getAccessToken(req, res);

        if (accessToken) {
          const params = projectId === undefined ? undefined : { project_id: projectId };
          const queries = [
            queryClient.prefetchQuery(getGetInstancesQueryKey(params), () =>
              getInstances(params, dmOptions(accessToken)),
            ),
            queryClient.prefetchQuery(getGetTasksQueryKey(params), () =>
              getTasks(params, dmOptions(accessToken)),
            ),
          ];

          // Make the queries in parallel
          await Promise.allSettled(queries);
        } else {
          return createErrorProps(res, 401, "Unauthorized");
        }
      } catch (error) {
        captureException(error);
        return createErrorProps(res, 500, "Error when fetching data server side");
      }

      return {
        props: {
          dehydratedState: dehydrate(queryClient),
        },
      };
    },
  })(ctx);
};

const Results = (props: ResultsProps) => {
  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
  }

  return (
    <>
      <Head>
        <title>Squonk | Results</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <ResultsView />
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Results);
