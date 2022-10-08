import { dehydrate, QueryClient } from "react-query";

import {
  getGetProductChargesQueryKey,
  getGetProductQueryKey,
  getProduct,
  getProductCharges,
} from "@squonk/account-server-client/product";

import { getAccessToken, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { captureException } from "@sentry/nextjs";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { ProductInvoiceView } from "../../../features/Finance/ProductInvoiceView";
import Layout from "../../../layouts/Layout";
import { createErrorProps } from "../../../utils/api/serverSidePropsError";
import { asOptions } from "../../../utils/api/ssrQueryOptions";
import type { NotSuccessful, ReactQueryPageProps } from "../../../utils/next/ssr";
import { isNotSuccessful } from "../../../utils/next/ssr";

export type InvoiceProps = NotSuccessful | ReactQueryPageProps;

export const getServerSideProps: GetServerSideProps<InvoiceProps> = async ({ req, res, query }) => {
  const { productId } = query;

  if (productId !== "" && typeof productId !== "string") {
    return createErrorProps(res, 400, "Product Id is not valid");
  }

  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    if (accessToken) {
      const queries = [
        queryClient.prefetchQuery(getGetProductChargesQueryKey(productId), () =>
          getProductCharges(productId, undefined, asOptions(accessToken)),
        ),
        queryClient.prefetchQuery(getGetProductQueryKey(productId), () =>
          getProduct(productId, asOptions(accessToken)),
        ),
      ];

      // Make the queries in parallel
      await Promise.allSettled(queries);
    }
  } catch (error) {
    captureException(error);
    return createErrorProps(res, 500, "Unknown error on the server");
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

const Invoice = (props: InvoiceProps) => {
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
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
      <Layout>
        <ProductInvoiceView productId={productId} />
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequired(Invoice);
