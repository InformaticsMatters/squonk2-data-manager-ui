import { getGetProductsQueryKey, getProducts } from "@squonk/account-server-client/product";

import { getAccessToken, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Container } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { GetServerSideProps } from "next";
import NextError from "next/error";
import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { ProductsView } from "../features/ProductsView";
import Layout from "../layouts/Layout";
import { createErrorProps } from "../utils/api/serverSidePropsError";
import { asOptions } from "../utils/api/ssrQueryOptions";
import type { CustomPageProps, ReactQueryPageProps } from "../utils/next/ssr";
import { isNotSuccessful } from "../utils/next/ssr";

export type ProductsProps = CustomPageProps<Record<string, never>>;

export const getServerSideProps: GetServerSideProps<ProductsProps | ReactQueryPageProps> = async ({
  req,
  res,
}) => {
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
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
        <Layout>
          <Container maxWidth="xl">
            <ProductsView />
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Products);
