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
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import Layout from "../../../layouts/Layout";
import { getErrorMessage } from "../../../utils/next/orvalError";

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  const taskId = router.query.taskId as string;

  const { data: task, error } = useGetTask(taskId);

  const refreshResults = [
    () => queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) }),
  ];

  return (
    <>
      <Head>
        <title>Squonk | Task {task?.states?.slice(-1)[0]?.state}</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
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
                    onClick={() => refreshResults.forEach((func) => void func())}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {error === null ? (
                task === undefined ? (
                  <CenterLoader />
                ) : (
                  <ResultTaskCard collapsedByDefault={false} task={{ ...task, id: taskId }} />
                )
              ) : (
                <Alert severity="error">{getErrorMessage(error)}</Alert>
              )}
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Result);
