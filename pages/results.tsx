import type { DehydratedState } from "react-query";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import { getGetInstancesQueryKey, getInstances } from "@squonk/data-manager-client/instance";
import { getGetTasksQueryKey, getTasks } from "@squonk/data-manager-client/task";

import { getAccessToken, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { captureException } from "@sentry/nextjs";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { ResultsView } from "../features/ResultsView";
import Layout from "../layouts/Layout";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { dmOptions } from "../utils/api/ssrQueryOptions";

interface NotSuccessful {
  statusCode: number;
  statusMessage: string;
}

export type TasksProps =
  | NotSuccessful
  | {
      dehydratedState: DehydratedState;
    };

const isNotSuccessful = (props: TasksProps): props is NotSuccessful => {
  return typeof (props as NotSuccessful).statusCode === "number";
};

export const getServerSideProps: GetServerSideProps<TasksProps> = async ({ req, res, query }) => {
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

  console.log(dehydrate(queryClient).queries[0]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

const Tasks = (props: TasksProps) => {
  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
  }

  return (
    <>
      <Head>
        <title>Squonk | Results</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
        <Layout>
          <ResultsView />
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Tasks);
