import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import { UnitUsageView } from "../../../features/usage/UnitUsageView";
import Layout from "../../../layouts/Layout";

const UserUsage = () => {
  const { query } = useRouter();
  const unitId = query.unitId;

  if (typeof unitId !== "string") {
    return null;
  }

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <UnitUsageView unitId={unitId} />
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(UserUsage);
