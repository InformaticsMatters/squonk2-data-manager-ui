import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import { getGetInstanceQueryKey, useGetInstances } from '@squonk/data-manager-client/instance';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Box, Button, Container, IconButton, Tooltip, Typography } from '@material-ui/core';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { CenterLoader } from '../../components/CenterLoader';
import Layout from '../../components/Layout';
import { OperationApplicationCard } from '../../components/operations/OperationApplicationCard';
import { OperationJobCard } from '../../components/operations/OperationJobCard';
import { RoleRequired } from '../../utils/RoleRequired';

const Task: FC = () => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const { pid } = router.query;

  const { data: instances } = useGetInstances(undefined, { query: { refetchInterval: 5000 } });

  const instance = instances?.instances.find((instance) => instance.id === pid);

  const refreshOperations = [
    () => queryClient.invalidateQueries(getGetInstanceQueryKey(pid as string)),
  ];

  return (
    <>
      <Head>
        <title>Squonk | Task {instance?.state}</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container maxWidth="md">
            <div
              css={css`
                display: flex;
                align-items: flex-start;
              `}
            >
              <Typography gutterBottom component="h1" variant="h4">
                Instance
              </Typography>
              <Tooltip title="Refresh Instance">
                <IconButton
                  css={css`
                    margin-left: auto;
                  `}
                  onClick={() => refreshOperations.forEach((func) => func())}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </div>
            {instance?.application_type === 'JOB' ? (
              <Box marginY={1}>
                <OperationJobCard poll collapsedByDefault={false} instance={instance} />
              </Box>
            ) : instance?.application_type === 'APPLICATION' ? (
              <OperationApplicationCard poll collapsedByDefault={false} instance={instance} />
            ) : (
              <CenterLoader />
            )}
            <NextLink
              passHref
              href={{ pathname: '/tasks', query: { project: instance?.project_id } }}
            >
              <Button color="primary">See all tasks</Button>
            </NextLink>
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Task);
