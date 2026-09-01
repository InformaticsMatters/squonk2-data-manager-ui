import { useEffect, useState } from "react";

import { KeyboardArrowDownRounded } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { SearchMenu } from "../../components/SearchMenu";
import {
  useSelectedOrganisation,
  useVisibleOrganisations,
  useVisibleOrganisationsArePending,
} from "../../state/organisationSelection";

/**
 * The organisation control in the masthead, as a way of working as a different one.
 *
 * Choosing an organisation is a **selection** — of the one domain scope ADR-0001 licenses to
 * persist between visits — where the project selector directly beneath it navigates. The two are
 * built on the same search menu even so, because the difference is in what choosing a row does and
 * not in how a caller finds the row: the keys, the highlight and the vocabulary spoken to assistive
 * technology are the same in both, so one habit serves both controls in the chrome.
 *
 * The list is read eagerly rather than when the menu is opened, because adopting the first visible
 * organisation has to happen for a caller who never opens it.
 */
export const OrganisationIdentity = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [organisation, setOrganisation, organisationId] = useSelectedOrganisation();
  const organisations = useVisibleOrganisations();
  const organisationsArePending = useVisibleOrganisationsArePending();

  useEffect(() => {
    // Member organisations come first, so a caller who later joins a real organisation is not left
    // working as the default one they were given while their only unit was personal.
    if (!organisationId && organisations[0]) {
      setOrganisation(organisations[0]);
    }
  }, [organisationId, organisations, setOrganisation]);

  // The organisation in effect is named from the list the caller can see, because that list names
  // every organisation it offers — including the default organisation, whose own addressed resource
  // is only readable by a member, its creator, or a platform administrator, and which an ordinary
  // caller is none of even while working as it. The detail read only completes a name the list
  // could not supply, which is now only an organisation chosen before this list could answer.
  const selected =
    organisations.find((candidate) => candidate.id === organisationId) ?? organisation;
  // Nothing is chosen only when nothing is known: an organisation that is in effect always names
  // itself, however it came to be selected.
  const label = selected?.name ?? (organisationId ? "Organisation" : "Choose organisation");

  // One rule, stated here rather than in a derivation of its own: a trimmed, case-insensitive match
  // on the name. Callers do not type identifiers, so identifiers are shown but not matched.
  const term = search.trim().toLocaleLowerCase();
  const rows = organisations
    .filter(({ name }) => !term || name.toLocaleLowerCase().includes(term))
    // The name over the identifier, so two similarly-named organisations can be told apart. No
    // icon: one icon repeated on every row of a single-kind list carries no information.
    .map(({ id, name }) => ({ id, primary: name, secondary: id }));

  const handleOrganisationChange = ({ id }: { id: string }) => {
    const option = organisations.find((candidate) => candidate.id === id);
    if (!option || option.id === organisationId) {
      return;
    }
    void router.push("/").then((navigated) => {
      if (navigated) {
        setOrganisation(option);
      }
    });
  };

  return (
    <SearchMenu
      ariaLabel="Change organisation"
      currentHint="The organisation you are working as"
      currentId={organisationId}
      emptyLabel={(value) => `No organisation matches “${value}”.`}
      // Leaving the resource on screen is stated before it happens rather than discovered after.
      footerNote="Opens Home"
      isPending={organisationsArePending}
      listLabel="Organisations"
      pendingLabel="Loading organisations…"
      renderTrigger={(bind) => (
        /* Identity variant (iv): the old outlined box holding the redesign's two-line label, so the
        bar says what the name is as well as naming it. No avatar. The trigger keeps the appearance
        it has today: borderless on this coloured masthead would read as a label, not a button.

        Drawn as a border rather than the outline it used to be, because the outline is the one
        thing that says where the keyboard is. A permanent outline here would have left this
        control's focus recolouring a box it already had, which is the weakest kind of change to
        notice; a border leaves the focus ring free to be an addition, as it is everywhere else. */
        <Button
          {...bind}
          color="inherit"
          endIcon={<KeyboardArrowDownRounded />}
          sx={{
            border: "2px solid",
            borderColor: "primary.light",
            borderRadius: 2,
            minWidth: 0,
            ml: 2,
            px: 1,
            py: 0.75,
            textTransform: "none",
          }}
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
      )}
      search={search}
      searchLabel="Search organisations"
      searchPlaceholder="Organisation"
      // The list does not change shape by length: a caller with one organisation still sees the
      // search field, because a control that reorganises itself by row count teaches nothing.
      sections={rows.length > 0 ? [{ rows }] : []}
      onSearchChange={setSearch}
      onSelect={handleOrganisationChange}
    />
  );
};
