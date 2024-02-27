import { getGetInstanceQueryKey } from "@squonk/data-manager-client/instance";

import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Box, Container, IconButton, Tooltip } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import NextError from "next/error";
import { useRouter } from "next/router";

import { RoleRequired } from "../../../components/auth/RoleRequired";
import { Instance } from "../../../components/instances/Instance";
import { AllResultsButton } from "../../../components/results/AllResultsButton";
import { EventDebugSwitch } from "../../../components/results/EventDebugSwitch";
import { AS_ROLES, DM_ROLES } from "../../../constants/auth";
import { InstanceTitle } from "../../../features/results/InstanceTitle";
import Layout from "../../../layouts/Layout";

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const { instanceId } = router.query;

  if (typeof instanceId !== "string") {
    return <NextError statusCode={400} statusMessage="Instance ID is invalid" />;
  }

  const refreshResults = [
    () => queryClient.invalidateQueries({ queryKey: getGetInstanceQueryKey(instanceId) }),
  ];

  return (
    <RoleRequired roles={DM_ROLES}>
      <RoleRequired roles={AS_ROLES}>
        <Layout>
          <Container maxWidth="md">
            <Box alignItems="flex-start" display="flex">
              <EventDebugSwitch />
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

            {instanceId && <InstanceTitle instanceId={instanceId} />}

            <Instance collapsedByDefault={false} instanceId={instanceId} />
            <AllResultsButton instanceId={instanceId} />
          </Container>
        </Layout>
      </RoleRequired>
    </RoleRequired>
  );
};

export default withPageAuthRequiredCSR(Result);
