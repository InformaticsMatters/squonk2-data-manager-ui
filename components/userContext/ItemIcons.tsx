import type { OrganisationDetail, UnitDetail } from "@squonk/account-server-client";

import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  PersonOutline as PersonOutlineIcon,
} from "@mui/icons-material";
import { Tooltip } from "@mui/material";

export const ItemIcons = ({ item }: { item?: OrganisationDetail | UnitDetail }) => (
  <>
    {item?.private !== undefined &&
      (item.private ? (
        <Tooltip title="Private">
          <LockIcon />
        </Tooltip>
      ) : (
        <Tooltip title="Public">
          <LockOpenIcon />
        </Tooltip>
      ))}
    {!!item?.caller_is_member && (
      <Tooltip title="Membership">
        <PersonOutlineIcon />
      </Tooltip>
    )}
  </>
);
