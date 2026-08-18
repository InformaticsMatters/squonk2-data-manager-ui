import { type ReactNode } from "react";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Grid, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";

import { narrowedTypes } from "./routes";
import { SectionSearchField } from "./SectionSearchField";

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
            onChange: (event) =>
              onStateChange({
                ...state,
                types: narrowedTypes(event.target.value as TFilter[], allTypes),
              }),
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
 * The controls a filtered project section puts above its list. A section writes its state to its
 * own route rather than to component state, so this only decides how that state is edited: which
 * types are shown, what is searched for, and when the catalogue is read again.
 *
 * The type filter is offered only by a section that has types worth choosing between. A section
 * narrowed to something only one kind of result can match offers none, because every entry in the
 * control would be a no-op or self-defeating — so the control is absent rather than present and
 * useless.
 *
 * When a keystroke reaches the route is not this toolbar's to decide: the field it puts above the
 * list owns that, so a section that lays its chrome out differently searches on identical terms.
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
}) => (
  <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
    {filter ? (
      <SectionTypeFilter filter={filter} state={state} onStateChange={onStateChange} />
    ) : null}
    {children}
    <Grid size={{ md: 4, sm: 5, xs: 12 }} sx={{ ml: "auto" }}>
      <SectionSearchField
        search={state.search}
        onSearch={(search) => onStateChange({ ...state, search })}
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
