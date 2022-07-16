import type { OrganisationDetail, UnitDetail } from "@squonk/account-server-client";

import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
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
