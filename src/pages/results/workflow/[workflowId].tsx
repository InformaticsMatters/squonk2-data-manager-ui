import { getGetRunningWorkflowQueryKey } from "@squonk/data-manager-client/workflow";

import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Box, Container, IconButton, Tooltip, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { RunningWorkflowCard } from "../../../components/RunningWorkflowCard/RunningWorkflowCard";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import Layout from "../../../layouts/Layout";

const WorkflowResult = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { workflowId } = router.query;

  if (typeof workflowId !== "string") {
    return <NextError statusCode={400} statusMessage="Workflow ID is invalid" />;
  }

  const refreshResults = [
    () => queryClient.invalidateQueries({ queryKey: getGetRunningWorkflowQueryKey(workflowId) }),
  ];

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <Container maxWidth="md">
            <Typography component="h1" variant="h1">
              Workflow
            </Typography>
            <Box sx={{ alignItems: "flex-start", display: "flex" }}>
              <Tooltip title="Refresh Workflow">
                <IconButton
                  size="large"
                  sx={{ ml: "auto" }}
                  onClick={() => refreshResults.forEach((func) => void func())}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <RunningWorkflowCard collapsedByDefault={false} runningWorkflowId={workflowId} />
          </Container>
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(WorkflowResult);
