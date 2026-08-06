import { type ReactNode, useEffect, useRef, useState } from "react";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Grid, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";

import { SearchTextField } from "../components/SearchTextField";
import { useKeyboardFocus } from "../hooks/useKeyboardFocus";

/** How long a search field waits before the route it owns is rewritten. */
const searchSettleMs = 300;

/** The list state a project section's own route carries. */
export type SectionListState<TFilter extends string> = {
  search?: string;
  types?: readonly TFilter[];
};

export type SectionFilterOption<TFilter extends string> = { label: string; value: TFilter };

/**
 * The controls a filtered project section puts above its list. Both sections write their state to
 * their own route rather than to component state, so this only decides how that state is edited:
 * which types are shown, what is searched for, and when the catalogue is read again.
 *
 * Typing rewrites the route, so the field is held locally and the route follows it once typing
 * settles: a section is never asked to re-render, or a history-free replace issued, per keystroke.
 */
export const SectionToolbar = <TFilter extends string>({
  children,
  filterLabel,
  filterOptions,
  filterSize,
  onRefresh,
  onStateChange,
  refreshLabel,
  state,
}: {
  /** Controls only one section offers, placed between the filter and the search field. */
  children?: ReactNode;
  filterLabel: string;
  filterOptions: readonly SectionFilterOption<TFilter>[];
  filterSize: { md: number; sm: number; xs: number };
  onRefresh: () => void;
  onStateChange: (change: SectionListState<TFilter>) => void;
  refreshLabel: string;
  state: SectionListState<TFilter>;
}) => {
  const allTypes = filterOptions.map(({ value }) => value);
  const [search, setSearch] = useState(state.search ?? "");
  const [typing, setTyping] = useState(false);
  const searchRef = useKeyboardFocus();

  // The route is the state, so the settled value is written against whatever the route says then,
  // not against the render the keystroke happened in.
  const latest = useRef({ onStateChange, state });
  useEffect(() => {
    latest.current = { onStateChange, state };
  });

  useEffect(() => setSearch(state.search ?? ""), [state.search]);

  useEffect(() => {
    if (!typing) {
      return;
    }
    const settle = setTimeout(() => {
      setTyping(false);
      latest.current.onStateChange({ ...latest.current.state, search: search || undefined });
    }, searchSettleMs);
    return () => clearTimeout(settle);
  }, [search, typing]);

  return (
    <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
      <Grid size={filterSize}>
        <TextField
          fullWidth
          select
          label={filterLabel}
          slotProps={{
            select: {
              multiple: true,
              onChange: (event) => {
                const selected = event.target.value as TFilter[];
                // A route carries the types it narrows to, so "all of them" and "none of them" are
                // the same absent value: emptying the filter clears it rather than asking the URL
                // to carry a selection it cannot express.
                onStateChange({
                  ...state,
                  types:
                    selected.length === 0 || selected.length === allTypes.length
                      ? undefined
                      : selected,
                });
              },
            },
          }}
          value={state.types ?? allTypes}
        >
          {filterOptions.map(({ label, value }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      {children}
      <Grid size={{ md: 4, sm: 5, xs: 12 }} sx={{ ml: "auto" }}>
        <SearchTextField
          fullWidth
          ref={searchRef}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setTyping(true);
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: "auto" }} sx={{ textAlign: "center" }}>
        <Tooltip title={refreshLabel}>
          <IconButton size="large" sx={{ ml: "auto" }} onClick={onRefresh}>
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};
