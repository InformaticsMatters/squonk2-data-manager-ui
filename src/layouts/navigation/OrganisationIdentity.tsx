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

  // The organisation in effect is named from the list the caller can see, because that list names
  // every organisation it offers. The addressed organisation's own resource is only readable by a
  // member, its creator, or a platform administrator, so the default organisation — which an
  // ordinary caller is none of — is refused there while still being a perfectly ordinary choice
  // here. The detail read only completes a name the list could not supply.
  const selected = data?.find((candidate) => candidate.id === organisationId) ?? organisation;
  // Nothing is chosen only when nothing is known: an organisation that is in effect always names
  // itself, however it came to be selected.
  const label = selected?.name ?? (organisationId ? "Organisation" : "Choose organisation");

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
            {label}
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
