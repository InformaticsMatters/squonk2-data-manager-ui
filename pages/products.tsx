import { getGetProductsQueryKey, getProducts } from "@squonk/account-server-client/product";

import {
  getAccessToken,
  withPageAuthRequired as withPageAuthRequiredSSR,
} from "@auth0/nextjs-auth0";
import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Container } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import NextError from "next/error";
import Head from "next/head";
import type { GetServerSideProps } from "nextjs-routes";

import { RoleRequired } from "../components/auth/RoleRequired";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { ProductsView } from "../features/ProductsView";
import Layout from "../layouts/Layout";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { asOptions } from "../utils/api/ssrQueryOptions";
import type { CustomPageProps, ReactQueryPageProps } from "../utils/next/ssr";
import { getFullReturnTo, isNotSuccessful } from "../utils/next/ssr";

export type ProductsProps = CustomPageProps<Record<string, never>>;

export const getServerSideProps: GetServerSideProps<ProductsProps | ReactQueryPageProps> = async (
  ctx,
) => {
  const returnTo = getFullReturnTo(ctx);
  return withPageAuthRequiredSSR<ProductsProps | ReactQueryPageProps>({
    returnTo,
    getServerSideProps: async ({ req, res }) => {
      const queryClient = new QueryClient();

      try {
        const { accessToken } = await getAccessToken(req, res);

        if (accessToken) {
          const queries = [
            queryClient.prefetchQuery(getGetProductsQueryKey(), () =>
              getProducts(asOptions(accessToken)),
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

export const Products = (props: ProductsProps) => {
  if (isNotSuccessful(props)) {
    const { statusCode, statusMessage } = props;
    return <NextError statusCode={statusCode} statusMessage={statusMessage} />;
  }
  return (
    <>
      <Head>
        <title>Squonk | Project</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <ProductsView />
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Products);
