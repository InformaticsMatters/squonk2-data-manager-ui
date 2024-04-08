import { useGetUnit } from "@squonk/account-server-client/unit";
import { useGetOrganisationUnitUsers } from "@squonk/account-server-client/user";
import {
  getGetUserInventoryQueryKey,
  useGetUserInventory,
} from "@squonk/data-manager-client/inventory";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { useCallback, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { CenterLoader } from "../CenterLoader";
import type { UserUsageByProjectTableProps } from "./UserUsageByProjectTable";
import { UserUsageTable } from "./UserUsageTable";

const UserUsageByProjectTable = dynamic<UserUsageByProjectTableProps>(
  () => import("./UserUsageByProjectTable").then((mod) => mod.UserUsageByProjectTable),
  { loading: () => <CircularProgress size="1rem" /> },
);

export interface UnitUserUsageProps {
  unitId: string;
}

export const UnitUserUsage = ({ unitId }: UnitUserUsageProps) => {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetUserInventoryQueryKey({ unit_id: unitId }),
    });
  }, [queryClient, unitId]);

  const { data, error: inventoryError } = useGetUserInventory({ unit_id: unitId });
  const { data: unit, error: unitError } = useGetUnit(unitId);
  const { data: unitUserList, error: unitUsersError } = useGetOrganisationUnitUsers(unitId);

  const [pivot, setPivot] = useState(false);

  if (inventoryError) {
    return <Alert severity="error">{inventoryError.message}</Alert>;
  }
  if (unitError) {
    return <Alert severity="error">{unitError.message}</Alert>;
  }
  if (unitUsersError) {
    return <Alert severity="error">{unitUsersError.message}</Alert>;
  }

  if (data === undefined || unit === undefined || unitUserList === undefined) {
    return <CenterLoader />;
  }

  const unitEditors = unitUserList.users.map((user) => user.id);
  const users = data.users
    .filter(
      (user) =>
        user.projects.observer.length +
          user.projects.editor.length +
          user.projects.administrator.length >
          0 ||
        unitEditors.includes(user.username) ||
        user.username === unit.owner_id,
    )
    .map((user) => ({ ...user, isEditor: unitEditors.includes(user.username) }));

  const pivotToggle = (
    <FormControlLabel
      control={<Switch checked={pivot} onChange={(event) => setPivot(event.target.checked)} />}
      label="By User / Project"
      labelPlacement="top"
    />
  );

  return (
    <Container maxWidth="xl">
      <Typography component="h2" variant="h1">
        User Usage
      </Typography>
      <Typography variant="h3">
        Unit: <em>{unit.name}</em>
      </Typography>

      <Typography>Owner: {unit.owner_id}</Typography>
      <Box marginY={1}>
        {pivot ? (
          <UserUsageByProjectTable
            toolbarContent={pivotToggle}
            users={users}
            onChange={invalidateQueries}
          />
        ) : (
          <UserUsageTable toolbarContent={pivotToggle} users={users} onChange={invalidateQueries} />
        )}
      </Box>
    </Container>
  );
};
