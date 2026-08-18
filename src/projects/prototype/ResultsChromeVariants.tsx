/**
 * PROTOTYPE — THROWAWAY. Not production code, no tests, no error handling.
 *
 * Each variant owns the whole top of the Results page — heading, count, type filter, search,
 * refresh, event-debug toggle and the definition chip — plus the treatment of the list beneath it.
 * They disagree about structure on purpose: pick one, or steal rows from each.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  FilterListRounded as FilterListRoundedIcon,
  MoreVertRounded as MoreVertRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import { SearchTextField } from "../../components/SearchTextField";
import { useEventDebugMode } from "../../state/eventDebugMode";
import { ResultsDefinitionChip } from "../ResultsDefinitionChip";
import { type ResultFilterType, type ResultsState } from "../routes";
import { type SectionFilterOption } from "../SectionToolbar";

export type ResultsChromeProps = {
  /** Read failures and dead-link warnings, unchanged by the variant. */
  alerts: ReactNode;
  /** The list, or the addressed result's detail. */
  children: ReactNode;
  /** How many results the current narrowing leaves. */
  count: number;
  filterOptions: readonly SectionFilterOption<ResultFilterType>[];
  onClearDefinition: () => void;
  onRefresh: () => void;
  onStateChange: (change: ResultsState) => void;
  /** The definition filter stated in words, where one is active. */
  statement?: string;
  state: ResultsState;
  /** How many results the project has before any narrowing. */
  total: number;
};

const searchSettleMs = 300;

/** Search that reaches the route once typing settles. Copied from SectionToolbar; behaviour only. */
const useSearchDraft = (state: ResultsState, onStateChange: (change: ResultsState) => void) => {
  const [draft, setDraft] = useState<string | null>(null);
  const latest = useRef({ onStateChange, state });

  useEffect(() => {
    latest.current = { onStateChange, state };
  });

  useEffect(() => {
    if (draft !== null && draft === (state.search ?? "")) {
      setDraft(null);
    }
  }, [draft, state.search]);

  useEffect(() => {
    if (draft === null) {
      return;
    }
    const settle = setTimeout(() => {
      const current = latest.current.state;
      const search = draft || undefined;
      latest.current.onStateChange(
        current.definition
          ? { definition: current.definition, ...(search ? { search } : {}) }
          : { types: current.types, ...(search ? { search } : {}) },
      );
    }, searchSettleMs);
    return () => clearTimeout(settle);
  }, [draft]);

  return { search: draft ?? state.search ?? "", setDraft };
};

/** The type narrowing, edited the same way whichever control a variant offers. */
const useTypeFilter = ({ filterOptions, onStateChange, state }: ResultsChromeProps) => {
  const allTypes = filterOptions.map(({ value }) => value);
  const selected = state.types ?? allTypes;

  return {
    allTypes,
    selected,
    setTypes: (next: readonly ResultFilterType[]) =>
      onStateChange({
        ...(state.search ? { search: state.search } : {}),
        types: next.length === 0 || next.length === allTypes.length ? undefined : next,
      }),
    toggle: (value: ResultFilterType) => {
      const next = selected.includes(value)
        ? selected.filter((type) => type !== value)
        : [...selected, value];
      return next;
    },
  };
};

const EventDebugToggle = ({ size = "medium" }: { size?: "medium" | "small" }) => {
  const [debug, setDebug] = useEventDebugMode();
  return (
    <FormControlLabel
      control={
        <Switch checked={debug} size={size} onChange={(_event, checked) => setDebug(checked)} />
      }
      label={<Typography variant="body2">Event debug</Typography>}
      sx={{ m: 0 }}
    />
  );
};

const CountLabel = ({ count, total }: { count: number; total: number }) => (
  <Typography color="text.secondary" variant="body2">
    {count === total ? `${total} result${total === 1 ? "" : "s"}` : `${count} of ${total}`}
  </Typography>
);

/**
 * Every variant applies this to the cards beneath it. The requirement sentence claims a whole row
 * of the actions area, which today pushes the expand chevron onto a row of its own and leaves a
 * band of empty card under the buttons — so the chevron is put back beside the buttons and the
 * sentence is left to run underneath them.
 */
const cardActionsFix = {
  "& .MuiCardActions-root > .MuiTypography-root": { order: 2, mt: 0.5 },
  "& .MuiCardActions-root > .MuiIconButton-root": { order: 1 },
};

/* ------------------------------------------------------------------ Variant A — Command bar --- */

/**
 * Everything the page can do to its list lives on one bar: identity and count on the left, the
 * things you act with on the right, and a second row that appears only when there is a narrowing to
 * state. The event-debug switch stops competing with the filters by moving into an overflow menu.
 */
export const VariantA = (props: ResultsChromeProps) => {
  const {
    alerts,
    children,
    count,
    filterOptions,
    onClearDefinition,
    onRefresh,
    statement,
    state,
    total,
  } = props;
  const { search, setDraft } = useSearchDraft(state, props.onStateChange);
  const { selected, setTypes } = useTypeFilter(props);
  const [overflow, setOverflow] = useState<HTMLElement | null>(null);
  const narrowed = statement !== undefined || state.types !== undefined;

  return (
    <>
      <Paper sx={{ borderRadius: 2, mb: 2, p: 1.5 }} variant="outlined">
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Typography component="h1" sx={{ mr: 0.5 }} variant="h5">
            Results
          </Typography>
          <CountLabel count={count} total={total} />
          <Box sx={{ flexGrow: 1 }} />
          <TextField
            placeholder="Search results"
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Refresh results">
                      <IconButton edge="end" size="small" onClick={onRefresh}>
                        <RefreshRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: "1 1 260px", maxWidth: 360 }}
            value={search}
            onChange={(event) => setDraft(event.target.value)}
          />
          <IconButton size="small" onClick={(event) => setOverflow(event.currentTarget)}>
            <MoreVertRoundedIcon />
          </IconButton>
          <Menu anchorEl={overflow} open={overflow !== null} onClose={() => setOverflow(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <EventDebugToggle size="small" />
            </Box>
          </Menu>
        </Box>

        <Box
          sx={{
            alignItems: "center",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1.5,
            pt: 1.5,
          }}
        >
          {statement === undefined ? (
            <>
              <Typography color="text.secondary" variant="body2">
                Show
              </Typography>
              <ToggleButtonGroup
                color="primary"
                size="small"
                value={[...selected]}
                onChange={(_event, next: ResultFilterType[]) => setTypes(next)}
              >
                {filterOptions.map(({ label, value }) => (
                  <ToggleButton key={value} sx={{ px: 1.5, py: 0.25 }} value={value}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {narrowed ? (
                <Button size="small" onClick={() => setTypes([])}>
                  Show all
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Typography color="text.secondary" variant="body2">
                Executions of
              </Typography>
              <Chip
                color="primary"
                label={statement}
                size="small"
                variant="outlined"
                onDelete={onClearDefinition}
              />
            </>
          )}
        </Box>
      </Paper>

      {alerts}

      <Box
        sx={{
          ...cardActionsFix,
          "& .MuiCard-root": {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: "none",
          },
          "& .MuiCardContent-root": { pb: 0, pt: 1.5 },
          "& .MuiCardActions-root": { pt: 0 },
        }}
      >
        {children}
      </Box>
    </>
  );
};

/* ------------------------------------------------------------------- Variant B — Filter rail --- */

/**
 * The controls leave the top of the page entirely and become a rail beside the list, so the page
 * header is one line — title, count, search — and nothing above the list competes with it. The
 * rail has room to name what it is doing, so the event-debug switch and the refresh both get words.
 */
export const VariantB = (props: ResultsChromeProps) => {
  const {
    alerts,
    children,
    count,
    filterOptions,
    onClearDefinition,
    onRefresh,
    statement,
    state,
    total,
  } = props;
  const { search, setDraft } = useSearchDraft(state, props.onStateChange);
  const { selected, setTypes, toggle } = useTypeFilter(props);

  return (
    <Box sx={{ display: "flex", flexDirection: { md: "row", xs: "column" }, gap: 3 }}>
      <Box
        sx={{
          flex: { md: "0 0 200px" },
          position: { md: "sticky" },
          alignSelf: "flex-start",
          top: 16,
        }}
      >
        <Typography color="text.secondary" variant="overline">
          Filter
        </Typography>
        {statement === undefined ? (
          <FormGroup>
            {filterOptions.map(({ label, value }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected.includes(value)}
                    size="small"
                    onChange={() => setTypes(toggle(value))}
                  />
                }
                key={value}
                label={<Typography variant="body2">{label}</Typography>}
              />
            ))}
          </FormGroup>
        ) : (
          <Box sx={{ py: 1 }}>
            <Typography sx={{ display: "block" }} variant="caption">
              Definition
            </Typography>
            <Chip
              color="primary"
              label={statement}
              size="small"
              sx={{
                height: "auto",
                maxWidth: "100%",
                my: 0.5,
                "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 },
              }}
              variant="outlined"
              onDelete={onClearDefinition}
            />
          </Box>
        )}
        <Divider sx={{ my: 1.5 }} />
        <Button
          fullWidth
          size="small"
          startIcon={<RefreshRoundedIcon />}
          variant="outlined"
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Divider sx={{ my: 1.5 }} />
        <EventDebugToggle size="small" />
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.5, mb: 1.5 }}>
          <Typography component="h1" variant="h4">
            Results
          </Typography>
          <CountLabel count={count} total={total} />
        </Box>
        <TextField
          fullWidth
          placeholder="Search results"
          size="small"
          sx={{ mb: 2 }}
          value={search}
          onChange={(event) => setDraft(event.target.value)}
        />
        {alerts}
        <Paper
          sx={{
            ...cardActionsFix,
            overflow: "hidden",
            "& .MuiGrid-container": { "--Grid-rowSpacing": "0px", "--Grid-columnSpacing": "0px" },
            "& .MuiCard-root": {
              borderBottom: "1px solid",
              borderColor: "divider",
              borderRadius: 0,
              boxShadow: "none",
            },
          }}
          variant="outlined"
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ Variant C — Search first --- */

/**
 * There is no toolbar. One omnibox spans the page with the filter and the refresh folded into it,
 * and whatever is currently narrowing the list is stated as chips beneath — so the page shows only
 * the narrowings that exist rather than a row of controls that are mostly at their defaults.
 */
export const VariantC = (props: ResultsChromeProps) => {
  const {
    alerts,
    children,
    count,
    filterOptions,
    onClearDefinition,
    onRefresh,
    statement,
    state,
    total,
  } = props;
  const { search, setDraft } = useSearchDraft(state, props.onStateChange);
  const { allTypes, selected, setTypes, toggle } = useTypeFilter(props);
  const [filters, setFilters] = useState<HTMLElement | null>(null);
  const activeCount =
    (statement === undefined ? 0 : 1) +
    (state.types === undefined ? 0 : allTypes.length - selected.length);

  return (
    <>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.5 }}>
        <Typography component="h1" variant="h6">
          Results
        </Typography>
        <CountLabel count={count} total={total} />
      </Box>
      <TextField
        fullWidth
        placeholder="Search this project's results"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title="Filter results">
                  <IconButton size="small" onClick={(event) => setFilters(event.currentTarget)}>
                    <Badge badgeContent={activeCount} color="primary">
                      <FilterListRoundedIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Refresh results">
                  <IconButton size="small" onClick={onRefresh}>
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mt: 1 }}
        value={search}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Popover
        anchorEl={filters}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        open={filters !== null}
        onClose={() => setFilters(null)}
      >
        <Box sx={{ p: 2 }}>
          {statement === undefined ? (
            <FormGroup>
              {filterOptions.map(({ label, value }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selected.includes(value)}
                      size="small"
                      onChange={() => setTypes(toggle(value))}
                    />
                  }
                  key={value}
                  label={<Typography variant="body2">{label}</Typography>}
                />
              ))}
            </FormGroup>
          ) : (
            <Typography sx={{ maxWidth: 240 }} variant="body2">
              Filtered to one definition, so there is nothing else to choose between.
            </Typography>
          )}
          <Divider sx={{ my: 1.5 }} />
          <EventDebugToggle size="small" />
        </Box>
      </Popover>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, mt: 1.5 }}>
        {statement === undefined ? null : (
          <Chip color="primary" label={statement} size="small" onDelete={onClearDefinition} />
        )}
        {state.types === undefined
          ? null
          : filterOptions
              .filter(({ value }) => selected.includes(value))
              .map(({ label, value }) => (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  variant="outlined"
                  onDelete={() => setTypes(toggle(value))}
                />
              ))}
      </Box>

      {alerts}

      <Box
        sx={{
          ...cardActionsFix,
          "& .MuiGrid-container": { "--Grid-rowSpacing": "8px" },
          "& .MuiCard-root": { border: "1px solid", borderColor: "divider", boxShadow: "none" },
          "& .MuiCardContent-root": { pb: 0, pt: 1, px: 1.5 },
          "& .MuiCardActions-root": { pt: 0, px: 1.5 },
          "& .MuiListItem-root": { py: 0 },
          "& .MuiListItemText-primary": { fontSize: 14 },
          "& .MuiListItemText-secondary": { fontSize: 12 },
        }}
      >
        {children}
      </Box>
    </>
  );
};

/* ------------------------------------------------- Variant D — the rail, as #1965 specifies it --- */

/**
 * B's rail, with the three things #1965 settled after it was chosen:
 *
 *  - the container widens from `md` to `lg`, so the list keeps roughly the width it had before the
 *    rail took 224px off it (see ProjectResults, which chooses the width);
 *  - the checkbox column becomes a multi-select again, stating its selection as chips rather than
 *    as a comma-joined sentence, and saying "All types" when it narrows nothing;
 *  - the list is left exactly as it is today. B flattened the cards into one outlined container,
 *    which drew a box around the empty state and around an addressed result as well. The chrome
 *    moves; the results beneath it do not.
 */

const AllTypes = () => (
  <Typography color="text.secondary" variant="body2">
    All types
  </Typography>
);

export const VariantD = (props: ResultsChromeProps) => {
  const { alerts, children, count, filterOptions, onClearDefinition, onRefresh, statement } = props;
  const { search, setDraft } = useSearchDraft(props.state, props.onStateChange);
  const { allTypes, selected, setTypes } = useTypeFilter(props);

  return (
    <Box sx={{ display: "flex", flexDirection: { md: "row", xs: "column" }, gap: 3 }}>
      <Box
        sx={{
          alignSelf: "flex-start",
          flex: { md: "0 0 200px" },
          position: { md: "sticky" },
          top: 16,
          width: "100%",
        }}
      >
        <Typography color="text.secondary" variant="overline">
          Filter
        </Typography>
        {statement === undefined ? (
          <TextField
            fullWidth
            select
            label="Filter Results"
            size="small"
            slotProps={{
              select: {
                multiple: true,
                renderValue: (value) => {
                  const chosen = value as string[];
                  return chosen.length === allTypes.length ? (
                    <AllTypes />
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {chosen.map((type) => (
                        <Chip
                          key={type}
                          label={filterOptions.find((option) => option.value === type)?.label}
                          size="small"
                        />
                      ))}
                    </Box>
                  );
                },
              },
            }}
            value={selected}
            onChange={(event) =>
              setTypes(event.target.value as unknown as readonly ResultFilterType[])
            }
          >
            {filterOptions.map(({ label, value }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Box>
            <Typography sx={{ display: "block" }} variant="caption">
              Definition
            </Typography>
            {/* The production chip: an inert chip carrying a real, named icon button. */}
            <ResultsDefinitionChip label={statement} onClear={onClearDefinition} />
          </Box>
        )}
        <Divider sx={{ my: 1.5 }} />
        <Button
          fullWidth
          aria-label="Refresh results"
          size="small"
          startIcon={<RefreshRoundedIcon />}
          variant="outlined"
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Divider sx={{ my: 1.5 }} />
        <EventDebugToggle size="small" />
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.5, mb: 1.5 }}>
          <Typography component="h1" variant="h4">
            Results
          </Typography>
          <CountLabel count={count} total={props.total} />
        </Box>
        <SearchTextField
          fullWidth
          size="small"
          sx={{ mb: 2 }}
          value={search}
          onChange={(event) => setDraft(event.target.value)}
        />
        {alerts}
        {children}
      </Box>
    </Box>
  );
};
