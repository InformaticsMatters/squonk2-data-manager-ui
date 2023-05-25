import {
  getGetProductChargesQueryKey,
  getGetProductQueryKey,
  getProduct,
  getProductCharges,
} from "@squonk/account-server-client/product";

import {
  getAccessToken,
  withPageAuthRequired as withPageAuthRequiredSSR,
} from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import NextError from "next/error";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "nextjs-routes";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { ProductChargesView } from "../../../features/Finance/ProductChargesView";
import Layout from "../../../layouts/Layout";
import { createErrorProps } from "../../../utils/api/serverSidePropsError";
import { asOptions } from "../../../utils/api/ssrQueryOptions";
import type { NotSuccessful, ReactQueryPageProps } from "../../../utils/next/ssr";
import { getFullReturnTo, isNotSuccessful } from "../../../utils/next/ssr";

export type ProductChargesProps = NotSuccessful | ReactQueryPageProps;

export const getServerSideProps: GetServerSideProps<ProductChargesProps> = async (ctx) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<ProductChargesProps>({
    returnTo,
    getServerSideProps: async ({ req, res, query }) => {
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
    },
  })(ctx);
};

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
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
      <Layout>
        <ProductChargesView productId={productId} />
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(ProductCharges);
