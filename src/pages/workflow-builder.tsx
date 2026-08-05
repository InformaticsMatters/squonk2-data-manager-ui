import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { withPageAuthRequired } from "../components/auth/withPageAuthRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { WorkflowBuilderPrototype } from "../features/WorkflowBuilder/prototype/WorkflowBuilderPrototype";

/**
 * Page hosting the workflow builder. Deliberately rendered without the app `Layout` so the builder
 * has the full viewport to itself.
 *
 * Currently hosting the UI prototype — three variants behind `?variant=`. Remove the
 * `WorkflowBuilderPrototype` import and `src/features/WorkflowBuilder/prototype` once a variant wins.
 */
const WorkflowBuilder = () => {
  return (
    <>
      <Head>
        <title>Squonk | Workflow Builder</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <WorkflowBuilderPrototype />
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(WorkflowBuilder);
