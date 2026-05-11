import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { withPageAuthRequired } from "../../../components/auth/withPageAuthRequired";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import { OrganisationUsageView } from "../../../features/usage/OrganisationUsageView";
import Layout from "../../../layouts/Layout";

const UserUsage = () => {
  const { query } = useRouter();
  const organisationId = query.organisationId;

  if (typeof organisationId !== "string") {
    return null;
  }

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <OrganisationUsageView organisationId={organisationId} />
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequired(UserUsage);
