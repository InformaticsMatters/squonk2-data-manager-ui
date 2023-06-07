import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import { UnitChargesView } from "../../../features/Finance/UnitChargesView";
import Layout from "../../../layouts/Layout";
import type { NotSuccessful, ReactQueryPageProps } from "../../../utils/next/ssr";
import { isNotSuccessful } from "../../../utils/next/ssr";

export type UnitChargesProps = NotSuccessful | ReactQueryPageProps;

const Charges = (props: UnitChargesProps) => {
  const { query } = useRouter();
  const unitId = query.unitId;

  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
  }

  if (typeof unitId !== "string") {
    return null;
  }

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <UnitChargesView unitId={unitId} />
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(Charges);
