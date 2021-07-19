import React, { FC } from 'react';
import { useQueryClient } from 'react-query';

import { getGetInstanceQueryKey, useGetInstances } from '@squonk/data-manager-client/instance';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import {
  Box,
  Button,
  Container,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import Layout from '../../components/Layout';
import { CenterLoader } from '../../components/Operations/common/CenterLoader';
import { OperationJobCard } from '../../components/Operations/OperationJobCard';

const Tasks: FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const router = useRouter();
  const { pid } = router.query;

  const { data: instances } = useGetInstances();

  const instance = instances?.instances.find((instance) => instance.id === pid);

  const refreshOperations = [
    () => queryClient.invalidateQueries(getGetInstanceQueryKey(pid as string)),
  ];

  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
        maxWidth="md"
      >
        <div
          css={css`
            display: flex;
            align-items: flex-start;
          `}
        >
          <Typography gutterBottom component="h1" variant="h4">
            Tasks
          </Typography>
          <Tooltip title="Refresh Tasks">
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
        {instance !== undefined ? (
          <Box marginY={1}>
            <OperationJobCard collapsedByDefault={false} instance={instance} />
          </Box>
        ) : (
          <CenterLoader />
        )}
        <NextLink passHref href={{ pathname: '/tasks', query: { project: instance?.project_id } }}>
          <Button color="primary">See all tasks</Button>
        </NextLink>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Tasks);
