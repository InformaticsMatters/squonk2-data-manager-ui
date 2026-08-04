import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { withPageAuthRequired } from "../components/auth/withPageAuthRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";

/**
 * Page hosting the workflow builder. Deliberately rendered without the app `Layout` so the builder
 * has the full viewport to itself.
 */
const WorkflowBuilder = () => {
  return (
    <>
      <Head>
        <title>Squonk | Workflow Builder</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>{/* Workflow builder UI goes here */}</RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(WorkflowBuilder);
