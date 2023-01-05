import { getGetTaskQueryKey, useGetTask } from "@squonk/data-manager-client/task";

import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Alert, Box, Container, IconButton, Tooltip, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import Head from "next/head";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { CenterLoader } from "../../../components/CenterLoader";
import { ResultTaskCard } from "../../../components/tasks/ResultTaskCard";
import Layout from "../../../layouts/Layout";
import { getErrorMessage } from "../../../utils/next/orvalError";

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  const taskId = router.query.taskId as string;

  const { data: task, error } = useGetTask(taskId);

  const refreshResults = [() => queryClient.invalidateQueries(getGetTaskQueryKey(taskId))];

  return (
    <>
      <Head>
        <title>Squonk | Task {task?.states?.slice(-1)[0]?.state}</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(" ")}>
        <Layout>
          <Container maxWidth="md">
            <Box alignItems="flex-start" display="flex">
              <Typography gutterBottom component="h1" variant="h3">
                Task
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
            {error !== null ? (
              <Alert severity="error">{getErrorMessage(error)}</Alert>
            ) : task === undefined ? (
              <CenterLoader />
            ) : (
              <ResultTaskCard collapsedByDefault={false} task={{ ...task, id: taskId }} />
            )}
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Result);
