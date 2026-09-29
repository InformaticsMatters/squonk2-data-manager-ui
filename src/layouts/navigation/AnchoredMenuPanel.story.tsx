import { useState } from "react";

import { Box, Button } from "@mui/material";

import { AppScaffold } from "../../stories/decorators";
import { AnchoredMenuPanel } from "./AnchoredMenuPanel";

/**
 * The panel alongside the thing it must not block: a button clear of the panel's own box that
 * records its own clicks. That recording is what separates this arrangement from a `Popover`,
 * whose backdrop covers the whole page and consumes the click that closed it, so the click never
 * reaches whatever was aimed at.
 */
export const Anchored = () => {
  const [open, setOpen] = useState(false);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const [insideClicks, setInsideClicks] = useState(0);

  return (
    <AppScaffold>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20, p: 2 }}
      >
        <Box sx={{ position: "relative", display: "flex" }}>
          <Button onClick={() => setOpen(!open)}>Account</Button>
          <AnchoredMenuPanel
            label="Account menu"
            open={open}
            width={240}
            onClose={() => setOpen(false)}
          >
            <Button fullWidth onClick={() => setInsideClicks((count) => count + 1)}>
              Inside
            </Button>
          </AnchoredMenuPanel>
        </Box>

        {/* Clear of the open panel — no dropdown can be clicked through, and the claim being made
            is about the rest of the page, which a Popover's backdrop would cover entirely. */}
        <Button onClick={() => setOutsideClicks((count) => count + 1)}>Elsewhere</Button>
      </Box>

      <form hidden>
        <input readOnly data-testid="outside-clicks" value={String(outsideClicks)} />
        <input readOnly data-testid="inside-clicks" value={String(insideClicks)} />
      </form>
    </AppScaffold>
  );
};
