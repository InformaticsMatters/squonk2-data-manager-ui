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

/** The type filter one section offers, where offering one is a choice the section makes. */
export type SectionFilterControl<TFilter extends string> = {
  label: string;
  options: readonly SectionFilterOption<TFilter>[];
  size: { md: number; sm: number; xs: number };
};

/** The control that edits which types a section's route narrows to, where the section offers one. */
const SectionTypeFilter = <TFilter extends string>({
  filter,
  onStateChange,
  state,
}: {
  filter: SectionFilterControl<TFilter>;
  onStateChange: (change: SectionListState<TFilter>) => void;
  state: SectionListState<TFilter>;
}) => {
  const allTypes = filter.options.map(({ value }) => value);

  return (
    <Grid size={filter.size}>
      <TextField
        fullWidth
        select
        label={filter.label}
        slotProps={{
          select: {
            multiple: true,
            onChange: (event) => {
              const selected = event.target.value as TFilter[];
              // A route carries the types it narrows to, so "all of them" and "none of them" are
              // the same absent value: emptying the filter clears it rather than asking the URL to
              // carry a selection it cannot express.
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
        {filter.options.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  );
};

/**
 * The controls a filtered project section puts above its list. Both sections write their state to
 * their own route rather than to component state, so this only decides how that state is edited:
 * which types are shown, what is searched for, and when the catalogue is read again.
 *
 * The type filter is offered only by a section that has types worth choosing between. A section
 * narrowed to something only one kind of result can match offers none, because every entry in the
 * control would be a no-op or self-defeating — so the control is absent rather than present and
 * useless.
 *
 * Typing rewrites the route, so the field is held locally and the route follows it once typing
 * settles: a section is never asked to re-render, or a history-free replace issued, per keystroke.
 */
export const SectionToolbar = <TFilter extends string>({
  children,
  filter,
  onRefresh,
  onStateChange,
  refreshLabel,
  state,
}: {
  /** Controls only one section offers, placed between the filter and the search field. */
  children?: ReactNode;
  filter?: SectionFilterControl<TFilter>;
  onRefresh: () => void;
  onStateChange: (change: SectionListState<TFilter>) => void;
  refreshLabel: string;
  state: SectionListState<TFilter>;
}) => {
  // A value that has been typed but has not reached the route yet. The route remains the state:
  // this only exists between a keystroke and the route carrying it.
  const [draft, setDraft] = useState<string | null>(null);
  const search = draft ?? state.search ?? "";
  const searchRef = useKeyboardFocus();

  // The route is the state, so a settled value is written against whatever the route says then,
  // not against the render the keystroke happened in.
  const latest = useRef({ onStateChange, state });
  useEffect(() => {
    latest.current = { onStateChange, state };
  });

  // The draft is given up only once the route carries it, so a route that has not caught up yet —
  // the one this field was replacing when the next keystroke arrived — can never overwrite what is
  // being typed.
  useEffect(() => {
    if (draft !== null && draft === (state.search ?? "")) {
      setDraft(null);
    }
  }, [draft, state.search]);

  useEffect(() => {
    if (draft === null) {
      return;
    }
    const settle = setTimeout(
      () => latest.current.onStateChange({ ...latest.current.state, search: draft || undefined }),
      searchSettleMs,
    );
    return () => clearTimeout(settle);
  }, [draft]);

  return (
    <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
      {filter ? (
        <SectionTypeFilter filter={filter} state={state} onStateChange={onStateChange} />
      ) : null}
      {children}
      <Grid size={{ md: 4, sm: 5, xs: 12 }} sx={{ ml: "auto" }}>
        <SearchTextField
          fullWidth
          ref={searchRef}
          value={search}
          onChange={(event) => setDraft(event.target.value)}
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
