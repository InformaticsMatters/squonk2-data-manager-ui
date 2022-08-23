import type { DehydratedState } from "react-query";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import { getGetInstancesQueryKey, getInstances } from "@squonk/data-manager-client/instance";
import { getGetProjectsQueryKey, getProjects } from "@squonk/data-manager-client/project";
import { getGetTasksQueryKey, getTasks } from "@squonk/data-manager-client/task";

import { getAccessToken, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { captureException } from "@sentry/nextjs";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import Head from "next/head";

import Layout from "../components/Layout";
import { ResultsView } from "../components/ResultsView";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { RoleRequired } from "../utils/RoleRequired";
import { options } from "../utils/ssrQueryOptions";

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

// This was a SSR test/example. Not sure if we want to do SSR everywhere but probably should.
export const getServerSideProps: GetServerSideProps<TasksProps> = async ({ req, res, query }) => {
  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    const projectId = query.project;

    if (typeof projectId !== "string") {
      return createErrorProps(res, 400, "Project ID is invalid");
    }

    if (projectId && accessToken) {
      const queries = [
        queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
          getProjects(options(accessToken)),
        ),
        queryClient.prefetchQuery(getGetInstancesQueryKey({ project_id: projectId }), () =>
          getInstances({ project_id: projectId }, options(accessToken)),
        ),
        queryClient.prefetchQuery(getGetTasksQueryKey({ project_id: projectId }), () =>
          getTasks({ project_id: projectId }, options(accessToken)),
        ),
      ];

      // Make the queries in parallel
      await Promise.allSettled(queries);
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
};

const Tasks = (props: TasksProps) => {
  const head = (
    <Head>
      <title>Squonk | Results</title>
    </Head>
  );

  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return (
      <>
        {head}
        <NextError statusCode={statusCode} statusMessage={statusMessage} />
      </>
    );
  }

  return (
    <>
      {head}
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
        <Layout>
          <ResultsView />
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Tasks);
