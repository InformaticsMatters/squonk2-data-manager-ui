import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import { Box, Button, Chip, Divider, MenuItem, TextField, Typography } from "@mui/material";

import { EventDebugSwitch } from "../components/results/EventDebugSwitch";
import { resultsTypeNarrowing, resultTypeLabels } from "./resultFacts";
import { ResultsDefinitionChip } from "./ResultsDefinitionChip";
import { type ResultFilterType, resultFilterTypes, type ResultsState } from "./routes";

/** What the control that narrows by type is called, wherever it is announced or addressed. */
export const filterResultsLabel = "Filter Results";

/** What the control that reads the section's collections again is called. */
export const refreshResultsLabel = "Refresh results";

/**
 * The control that edits which types the list narrows to. It stays one control that is opened and
 * chosen from rather than a column of checkboxes: the rail's height is better spent on what the
 * list is narrowed to than on the three choices behind it.
 *
 * What is selected is stated as one chip per type rather than as a comma-joined sentence, and the
 * selection that narrows nothing is stated as that rather than as a list of every label the control
 * offers — a route carries no types either way, so "I have selected all three" is not a state a
 * caller can be in.
 */
const ResultsTypeFilter = ({
  onTypesChange,
  types,
}: {
  onTypesChange: (types?: readonly ResultFilterType[]) => void;
  types?: readonly ResultFilterType[];
}) => (
  <TextField
    fullWidth
    select
    label={filterResultsLabel}
    size="small"
    slotProps={{
      select: {
        multiple: true,
        onChange: (event) =>
          onTypesChange(resultsTypeNarrowing(event.target.value as ResultFilterType[])),
        renderValue: (value) => {
          const selected = value as readonly ResultFilterType[];
          return resultsTypeNarrowing(selected) === undefined ? (
            <Typography color="text.secondary" variant="body2">
              All types
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((type) => (
                <Chip key={type} label={resultTypeLabels[type]} size="small" />
              ))}
            </Box>
          );
        },
      },
    }}
    value={types ?? resultFilterTypes}
  >
    {resultFilterTypes.map((value) => (
      <MenuItem key={value} value={value}>
        {resultTypeLabels[value]}
      </MenuItem>
    ))}
  </TextField>
);

/**
 * The one narrowing the rail carries. Which of the two it is, is the route's to settle and not the
 * catalogue's: the type filter is displaced the moment a route carries a definition filter, and
 * stays displaced while the catalogue that would name that definition is still answering. A choice
 * made in a type filter offered during that wait could only be written by dropping the definition
 * the caller has just followed, and no choice it offers could change what is shown anyway.
 *
 * A definition nothing can state yet is therefore stated by neither control, which is the same
 * moment the list beneath is a loading indicator rather than a list.
 */
const ResultsNarrowing = ({
  onClearDefinition,
  onTypesChange,
  state,
  statement,
}: {
  onClearDefinition: () => void;
  onTypesChange: (types?: readonly ResultFilterType[]) => void;
  state: ResultsState;
  statement?: string;
}) => {
  if (state.definition === undefined) {
    return <ResultsTypeFilter types={state.types} onTypesChange={onTypesChange} />;
  }
  return statement === undefined ? null : (
    <Box>
      <Typography sx={{ display: "block" }} variant="caption">
        Definition
      </Typography>
      <ResultsDefinitionChip label={statement} onClear={onClearDefinition} />
    </Box>
  );
};

/**
 * The controls a Results list is narrowed and refreshed by, beside the list rather than stacked
 * above it, so the first thing a caller reads on the page is the results. It sticks as the list
 * scrolls past it, so a long list can be narrowed without scrolling back to the top, and it has the
 * width to name what its controls do in words rather than in icons alone.
 *
 * Exactly one narrowing control is offered, in the one place: the type filter, or — where the route
 * carries a definition filter, which displaces it — the chip that states that filter. The two are
 * mutually exclusive in the route already, so swapping them moves neither the search field nor the
 * list; a chip long enough to need more lines grows the rail downwards and nothing else.
 *
 * Refreshing and event debugging narrow nothing — they act on the page as a whole — so both sit
 * beneath a divider, apart from the control that does.
 */
export const ResultsRail = ({
  onClearDefinition,
  onRefresh,
  onTypesChange,
  state,
  statement,
}: {
  onClearDefinition: () => void;
  onRefresh: () => void;
  onTypesChange: (types?: readonly ResultFilterType[]) => void;
  state: ResultsState;
  /** The definition filter stated in words, once the catalogue that names it has answered. */
  statement?: string;
}) => (
  <Box
    component="aside"
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
    <ResultsNarrowing
      state={state}
      statement={statement}
      onClearDefinition={onClearDefinition}
      onTypesChange={onTypesChange}
    />
    <Divider sx={{ my: 1.5 }} />
    <Button
      fullWidth
      size="small"
      startIcon={<RefreshRoundedIcon />}
      variant="outlined"
      onClick={onRefresh}
    >
      {refreshResultsLabel}
    </Button>
    <Box sx={{ mt: 1 }}>
      <EventDebugSwitch />
    </Box>
  </Box>
);
