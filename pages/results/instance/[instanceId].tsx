import { useQueryClient } from "react-query";

import { getGetInstanceQueryKey, useGetInstances } from "@squonk/data-manager-client/instance";

import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, Container, IconButton, Tooltip, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { CenterLoader } from "../../../components/CenterLoader";
import Layout from "../../../components/Layout";
import type { ResultApplicationCardProps } from "../../../components/results/ResultApplicationCard";
import type { ResultJobCardProps } from "../../../components/results/ResultJobCard";
import { APP_ROUTES } from "../../../constants/routes";
import { RoleRequired } from "../../../utils/RoleRequired";

const ResultJobCard = dynamic<ResultJobCardProps>(
  () => import("../../../components/results/ResultJobCard").then((mod) => mod.ResultJobCard),
  { loading: () => <CenterLoader /> },
);

const ResultApplicationCard = dynamic<ResultApplicationCardProps>(
  () =>
    import("../../../components/results/ResultApplicationCard").then(
      (mod) => mod.ResultApplicationCard,
    ),
  { loading: () => <CenterLoader /> },
);

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const { instanceId } = router.query;

  const { data: instances } = useGetInstances(undefined, { query: { refetchInterval: 5000 } });

  const instance = instances?.instances.find((instance) => instance.id === instanceId);

  const refreshResults = [
    () => queryClient.invalidateQueries(getGetInstanceQueryKey(instanceId as string)),
  ];

  return (
    <>
      <Head>
        <title>Squonk | Instance {instance?.phase}</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(" ")}>
        <Layout>
          <Container maxWidth="md">
            <Box alignItems="flex-start" display="flex">
              <Typography gutterBottom component="h1" variant="h3">
                Instance
              </Typography>
              <Tooltip title="Refresh Instance">
                <IconButton
                  size="large"
                  sx={{ ml: "auto" }}
                  onClick={() => refreshResults.forEach((func) => func())}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {instance?.application_type === "JOB" ? (
              <Box marginY={1}>
                <ResultJobCard poll collapsedByDefault={false} instance={instance} />
              </Box>
            ) : instance?.application_type === "APPLICATION" ? (
              <ResultApplicationCard poll collapsedByDefault={false} instance={instance} />
            ) : (
              <CenterLoader />
            )}
            <NextLink
              passHref
              href={{ pathname: APP_ROUTES.results["."], query: { project: instance?.project_id } }}
            >
              <Button color="primary">See all results</Button>
            </NextLink>
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Result);
