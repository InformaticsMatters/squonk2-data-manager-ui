import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

/**
 * Displays a button which controls the theme of the application.
 */
export const ColourSchemeSelection = () => {
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        color: "text.primary",
        borderRadius: 1,
        p: 3,
        minHeight: "56px",
      }}
    >
      <FormControl>
        <FormLabel id="demo-theme-toggle">Theme</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-theme-toggle"
          name="theme-toggle"
          value={mode}
          onChange={(event) => setMode(event.target.value as "dark" | "light" | "system")}
        >
          <FormControlLabel control={<Radio />} label="System" value="system" />
          <FormControlLabel control={<Radio />} label="Light" value="light" />
          <FormControlLabel control={<Radio />} label="Dark" value="dark" />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};
