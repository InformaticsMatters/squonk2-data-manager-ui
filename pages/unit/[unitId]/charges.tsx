import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
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
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
      <Layout>
        <UnitChargesView unitId={unitId} />
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequired(Charges);
