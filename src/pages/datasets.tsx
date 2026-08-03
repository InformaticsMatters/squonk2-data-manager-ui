import Head from "next/head";

import { pagePolicies, withPagePolicy } from "../application/pagePolicy";
import { DatasetsWorkspace } from "../datasets/DatasetsWorkspace";

/**
 * The datasets page displays datasets the user is able to see and allows the user to manage these.
 */
const Datasets = () => {
  return (
    <>
      <Head>
        <title>Squonk | Datasets</title>
      </Head>
      <DatasetsWorkspace />
    </>
  );
};

export default withPagePolicy(pagePolicies.datasets("list"), Datasets);
