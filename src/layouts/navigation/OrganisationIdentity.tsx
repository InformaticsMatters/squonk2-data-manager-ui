import { useEffect, useState } from "react";

import { type OrganisationDetail } from "@/api/account-server";
import { useGetOrganisations } from "@/api/account-server/organisation";

import { BusinessRounded, KeyboardArrowDownRounded } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { useSelectedOrganisation } from "../../state/organisationSelection";

export const OrganisationIdentity = () => {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [organisation, setOrganisation, organisationId] = useSelectedOrganisation();
  const { data } = useGetOrganisations(undefined, {
    query: { select: (response) => response.organisations },
  });

  useEffect(() => {
    if (!organisationId && data?.[0]) {
      setOrganisation(data[0]);
    }
  }, [organisationId, data, setOrganisation]);

  const handleOrganisationChange = (option: OrganisationDetail) => {
    setAnchor(null);
    if (option.id === organisationId) {
      return;
    }
    void router.push("/").then((navigated) => {
      if (navigated) {
        setOrganisation(option);
      }
    });
  };

  return (
    <>
      <Button
        aria-label="Change organisation"
        color="inherit"
        endIcon={<KeyboardArrowDownRounded />}
        sx={{ minWidth: 0, px: 0.5, textTransform: "none" }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <Avatar sx={{ bgcolor: "#d64b35", height: 30, width: 30 }}>
            <BusinessRounded fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0, textAlign: "left" }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1.1 }}>
              {organisation?.name ?? "Choose organisation"}
            </Typography>
            <Typography
              noWrap
              sx={{ display: { xs: "none", sm: "block" }, fontSize: 9, letterSpacing: 1 }}
            >
              ORGANISATION
            </Typography>
          </Box>
        </Stack>
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {(data ?? []).map((option) => (
          <MenuItem
            key={option.id}
            selected={option.id === organisationId}
            onClick={() => handleOrganisationChange(option)}
          >
            <ListItemIcon>
              <BusinessRounded fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={option.name} secondary={option.id} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
