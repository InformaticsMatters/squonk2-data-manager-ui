import { CloseRounded as CloseRoundedIcon } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";

/** What the control that clears the filter is called, wherever it is announced or addressed. */
export const clearDefinitionFilterLabel = "Clear definition filter";

/**
 * The definition filter a Results list carries, stated on the page. A caller who arrived from a
 * link someone sent them can tell what they are looking at without reading the URL, and can get
 * back to the whole list without editing it or using the back button.
 *
 * The chip states; only the clear affordance acts. It is a button in its own right rather than a
 * decorated icon, so it is announced as a control with a name — and the chip around it is left
 * inert rather than made a second, larger control announcing the same name as the one inside it.
 *
 * The label wraps rather than being truncated and the clear control keeps a tap target well above
 * the 24px WCAG minimum, so both stay legible and usable on a phone.
 */
export const ResultsDefinitionChip = ({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) => (
  <Chip
    label={
      <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
        <Box component="span" sx={{ overflowWrap: "anywhere", whiteSpace: "normal" }}>
          {label}
        </Box>
        <IconButton
          aria-label={clearDefinitionFilterLabel}
          sx={{ flexShrink: 0, height: 32, width: 32 }}
          onClick={onClear}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    }
    sx={{ height: "auto", maxWidth: "100%", mb: 2, py: 0.5 }}
    variant="outlined"
  />
);
