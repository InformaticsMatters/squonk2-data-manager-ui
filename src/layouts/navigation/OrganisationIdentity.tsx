import { useEffect, useState } from "react";

import { type OrganisationDetail } from "@/api/account-server";
import { useGetOrganisations } from "@/api/account-server/organisation";

import { BusinessRounded, KeyboardArrowDownRounded } from "@mui/icons-material";
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
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
      {/* Identity variant (iv): the old outlined box holding the redesign's two-line label, so the
      bar says what the name is as well as naming it. No avatar. */}
      <Button
        aria-label="Change organisation"
        color="inherit"
        endIcon={<KeyboardArrowDownRounded />}
        sx={{
          borderRadius: 2,
          minWidth: 0,
          ml: 2,
          outline: "2px solid",
          outlineColor: "primary.light",
          px: 1,
          py: 0.75,
          textTransform: "none",
        }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Box sx={{ minWidth: 0, textAlign: "left" }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1.1 }}>
            {organisation?.name ?? "Choose organisation"}
          </Typography>
          <Typography noWrap sx={{ fontSize: 9, letterSpacing: 1 }}>
            ORGANISATION
          </Typography>
        </Box>
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
