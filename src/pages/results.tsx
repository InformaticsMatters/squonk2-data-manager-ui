import NextError from "next/error";
import Head from "next/head";

import { pagePolicies, withPagePolicy } from "../application/pagePolicy";
import { RoleRequired } from "../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { ResultsView } from "../features/ResultsView";
import Layout from "../layouts/Layout";
import { type NotSuccessful, type ReactQueryPageProps } from "../utils/next/ssr";

export type ResultsProps = NotSuccessful | ReactQueryPageProps;
const isNotSuccessful = (props: ResultsProps): props is NotSuccessful => {
  return typeof (props as NotSuccessful).statusCode === "number";
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

export default withPagePolicy(pagePolicies.application, Results);
