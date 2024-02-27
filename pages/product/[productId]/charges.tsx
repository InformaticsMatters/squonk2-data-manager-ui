import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import { ProductChargesView } from "../../../features/Finance/ProductChargesView";
import Layout from "../../../layouts/Layout";
import type { NotSuccessful, ReactQueryPageProps } from "../../../utils/next/ssr";
import { isNotSuccessful } from "../../../utils/next/ssr";

export type ProductChargesProps = NotSuccessful | ReactQueryPageProps;

const ProductCharges = (props: ProductChargesProps) => {
  const { query } = useRouter();
  const productId = query.productId;

  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
  }

  if (typeof productId !== "string") {
    return null;
  }

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <ProductChargesView productId={productId} />
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(ProductCharges);
