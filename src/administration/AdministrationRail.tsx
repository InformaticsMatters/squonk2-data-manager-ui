import { useEffect, useState } from "react";

import { useGetOrganisationUnits } from "@/api/account-server/unit";

import {
  BusinessRounded,
  FolderSharedRounded,
  LockOutlined,
  PaymentsOutlined,
  PersonRounded,
  PublicOutlined,
  QueryStatsOutlined,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Divider,
  InputAdornment,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { retryAdministrationRead, useAccessFacts } from "./accessFacts";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { organisationChargesAreOffered } from "./scope";
import { buildUnitIndex, type UnitIndexRow } from "./unitIndex";

/** The rail is sized by its content and capped below the viewport, which is what makes it stick. */
const RAIL_WIDTH = 288;
// Capped well below the viewport, and floored beneath by the content pane, so the row holding the
// rail is always taller than the rail itself — which is the whole of what makes it stick.
const RAIL_MAX_HEIGHT = "calc(100vh - 220px)";

/**
 * Which rail entry the current route selects. The rail is a set of links and the current
 * destination is the selected row, so this is read from the route rather than remembered.
 */
const selectedRailEntry = (route: AdministrationRoute | null): string => {
  if (!route) {
    return "";
  }
  switch (route.kind) {
    case "overview":
      return "organisation:overview";
    case "organisation-charges":
      return "organisation:charges";
    case "organisation-usage":
      return "organisation:usage";
    case "subscription-entry":
      return "";
    default:
      return `unit:${route.unitId}`;
  }
};

/**
 * The organisation's units, narrowed. Both renderings of the list — the rail and the panel that
 * replaces it below the rail's breakpoint — read them here, so neither can list a different set or
 * explain an empty one differently.
 *
 * The read is the organisation-scoped units endpoint, which answers with the units the caller may
 * see or that are public and requires no membership of the organisation itself. That is what keeps
 * this list — and with it the whole overview — readable in the default organisation, where an
 * ordinary caller may not read the organisation resource at all.
 */
const useUnitIndex = (organisationId: string, search?: string) => {
  const { personalUnitId } = useAccessFacts();
  const { data, isError, isPending } = useGetOrganisationUnits(organisationId, {
    query: { retry: retryAdministrationRead },
  });

  return {
    ...buildUnitIndex(data ?? { units: [] }, { personalUnitId, search }),
    isError,
    isPending,
  };
};

/** Why the list is empty, said the same way wherever the list is rendered. */
const unitIndexEmptiness = {
  "no-matches": "No unit matches this search.",
  "no-units": "This organisation has no units yet.",
} as const;

const UNITS_UNREADABLE = "The units of this organisation could not be listed.";

const UnitRow = ({ row, selected }: { row: UnitIndexRow; selected: boolean }) => (
  <ListItemButton component={Link} href={row.href as never} selected={selected}>
    <ListItemIcon sx={{ minWidth: 34 }}>
      {row.isPersonal ? (
        <PersonRounded fontSize="small" />
      ) : (
        <FolderSharedRounded fontSize="small" />
      )}
    </ListItemIcon>
    <ListItemText
      primary={row.unitName}
      secondary={row.isPersonal ? "Personal unit" : `${row.memberCount} members`}
      slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
    />
    {row.isPrivate ? (
      <LockOutlined sx={{ color: "text.secondary", fontSize: 16 }} titleAccess="Private" />
    ) : (
      <PublicOutlined sx={{ color: "text.secondary", fontSize: 16 }} titleAccess="Public" />
    )}
  </ListItemButton>
);

/**
 * The units of the organisation in effect, and the entries for the organisation itself.
 *
 * It is the workspace's one selector and it never leaves the screen, which is the whole point of
 * the restructure: moving between a unit's access, its spend and its usage costs three tab clicks
 * rather than three list searches, and moving to another unit costs one click in a list that is
 * already there.
 *
 * The unit list is read from the organisation-scoped units endpoint, which answers with the units
 * the caller may see or that are public and requires no membership of the organisation itself. That
 * is what keeps this list — and with it the whole overview — readable in the default organisation,
 * where an ordinary caller may not read the organisation resource at all.
 */
export const AdministrationRail = ({
  organisationId,
  organisationName,
  route,
}: {
  organisationId: string;
  organisationName: string | undefined;
  route: AdministrationRoute | null;
}) => {
  const router = useRouter();
  const { defaultOrganisationId } = useAccessFacts();
  const routeSearch = route?.kind === "overview" ? route.search : undefined;
  const [search, setSearch] = useState(routeSearch ?? "");
  const { emptiness, isError, isPending, rows, total } = useUnitIndex(organisationId, search);

  useEffect(() => setSearch(routeSearch ?? ""), [routeSearch]);

  const selected = selectedRailEntry(route);
  const organisationEntries = [
    {
      href: administrationLinks.overview(),
      icon: <BusinessRounded fontSize="small" />,
      key: "organisation:overview",
      label: "Overview",
    },
    // The Account Server refuses organisation charges for the default organisation outright, for
    // every caller, so the entry is withheld rather than offered and then refused.
    ...(organisationChargesAreOffered(organisationId, defaultOrganisationId)
      ? [
          {
            href: administrationLinks.organisationCharges(),
            icon: <PaymentsOutlined fontSize="small" />,
            key: "organisation:charges",
            label: "Charges",
          },
        ]
      : []),
    {
      href: administrationLinks.organisationUsage(),
      icon: <QueryStatsOutlined fontSize="small" />,
      key: "organisation:usage",
      label: "Usage & Inventory",
    },
  ];

  /**
   * The search term is the overview's own URL state, so a narrowed list can be shared and survives
   * a refresh. Inside a unit there is no route that owns it, so narrowing the rail there is a view
   * of the screen the caller is already on rather than somewhere they went.
   */
  const narrow = (value: string) => {
    setSearch(value);
    if (route?.kind === "overview") {
      void router.replace(
        administrationLinks.overview({ search: value || undefined }) as never,
        undefined,
        { shallow: true },
      );
    }
  };

  return (
    <Paper
      aria-label="Administration"
      component="nav"
      sx={{
        display: { md: "flex", xs: "none" },
        flexDirection: "column",
        flexShrink: 0,
        // Sticky travel is the height of the row holding the rail minus the rail's own height, so a
        // rail as tall as the viewport is as tall as its row: it pins for a few pixels and then
        // scrolls away, which reads as not sticky at all. Capping it below the viewport, and
        // flooring the content pane beside it, leaves real travel in both directions.
        maxHeight: RAIL_MAX_HEIGHT,
        position: "sticky",
        top: 16,
        width: RAIL_WIDTH,
      }}
      variant="outlined"
    >
      <Box sx={{ p: 2 }}>
        {/* The rail names the organisation it lists; the content pane's own title is the page's
            one heading, so this label never competes with it in the document outline. */}
        <Typography noWrap sx={{ fontWeight: 700 }} variant="subtitle1">
          {organisationName ?? "Organisation"}
        </Typography>
        <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="caption">
          {organisationId}
        </Typography>
      </Box>
      <Divider />
      <List dense disablePadding>
        {organisationEntries.map((entry) => (
          <ListItemButton
            component={Link}
            href={entry.href as never}
            key={entry.key}
            selected={selected === entry.key}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>{entry.icon}</ListItemIcon>
            <ListItemText primary={entry.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <TextField
          fullWidth
          label="Search units"
          placeholder={total === 0 ? "Search units" : `Search ${total} units`}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          value={search}
          onChange={(event) => narrow(event.target.value)}
        />
      </Box>
      {/* Only the unit list scrolls, so the organisation entries and the search field hold their
          position however many units the organisation has. */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
        {isPending ? <LinearProgress /> : null}
        {isError ? (
          <Alert severity="warning" sx={{ m: 1.5 }}>
            {UNITS_UNREADABLE}
          </Alert>
        ) : null}
        <List
          dense
          disablePadding
          aria-label="Units"
          subheader={<ListSubheader>Units</ListSubheader>}
        >
          {rows.map((row) => (
            <UnitRow key={row.unitId} row={row} selected={selected === `unit:${row.unitId}`} />
          ))}
        </List>
        {emptiness && !isPending && !isError ? (
          <Typography color="text.secondary" sx={{ p: 1.5 }} variant="body2">
            {unitIndexEmptiness[emptiness]}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
};

/**
 * The same unit list, for viewports with no room for a rail. Below the `md` breakpoint the rail
 * collapses and the unit list becomes part of the overview's own content, so the workspace's one
 * selector is never simply absent.
 */
export const UnitListPanel = ({ organisationId }: { organisationId: string }) => {
  const { emptiness, isError, rows } = useUnitIndex(organisationId);

  if (isError) {
    return <Alert severity="warning">{UNITS_UNREADABLE}</Alert>;
  }
  if (emptiness) {
    return <Typography color="text.secondary">{unitIndexEmptiness[emptiness]}</Typography>;
  }
  return (
    <List dense disablePadding>
      {rows.map((row) => (
        <UnitRow key={row.unitId} row={row} selected={false} />
      ))}
    </List>
  );
};
