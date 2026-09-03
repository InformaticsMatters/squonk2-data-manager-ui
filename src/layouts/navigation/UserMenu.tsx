import { useState } from "react";

import { AccountCircle as AccountCircleIcon } from "@mui/icons-material";
import { Badge, Box, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { useAtom } from "jotai";

import { EventStreamMessages } from "../../components/eventStream/EventStreamMessages";
import { useASAuthorizationStatus, useDMAuthorizationStatus } from "../../hooks/useIsAuthorized";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import { eventStreamSidebarOpenAtom } from "../../state/eventStream";
import { useUnreadEventCount } from "../../state/notifications";
import { AnchoredMenuPanel } from "./AnchoredMenuPanel";
import { UserMenuContent } from "./UserMenuContent";

const PANEL_WIDTH = 320;

/**
 * The account menu in the masthead.
 *
 * Rendered client-only via `dynamic({ ssr: false })` in NavBarContents — better-auth's useSession
 * is client-only, so SSR has no session info while the client can resolve a session synchronously
 * from the cookie cache; the resulting prop drift trips MUI's IconButton `disabled || loading =
 * null` quirk on the underlying <button>. Skipping SSR for this control avoids that path.
 */
export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  // The badge is cleared on opening, so the panel would otherwise always report nothing new. The
  // count is held as it stood at that moment, which is what the caller came to read.
  const [countWhenOpened, setCountWhenOpened] = useState(0);

  const { user, isLoading, error } = useKeycloakUser();
  const dmRole = useDMAuthorizationStatus();
  const asRole = useASAuthorizationStatus();
  const { count, resetCount } = useUnreadEventCount();
  const [isSidebarOpen, setSidebarOpen] = useAtom(eventStreamSidebarOpenAtom);

  const theme = useTheme();
  // Below `md` the sidebar renders nothing at all, so the menu carries the stream itself rather
  // than offering a toggle that would do nothing.
  const isSidebarAvailable = useMediaQuery(theme.breakpoints.up("md"));

  const handleToggle = () => {
    if (!open) {
      setCountWhenOpened(count);
      resetCount();
    }
    setOpen(!open);
  };

  return (
    <Box sx={{ position: "relative", display: "flex" }}>
      {/* Blanked while open so the tooltip does not hang over the panel it describes. */}
      <Tooltip title={open ? "" : "Account"}>
        <span>
          <Badge badgeContent={count} color="success" max={99}>
            <IconButton
              aria-expanded={open}
              aria-label="Account"
              color="inherit"
              disabled={isLoading}
              edge="end"
              loading={false}
              size="large"
              onClick={handleToggle}
            >
              <AccountCircleIcon />
            </IconButton>
          </Badge>
        </span>
      </Tooltip>

      <AnchoredMenuPanel
        label="Account menu"
        open={open}
        width={PANEL_WIDTH}
        onClose={() => setOpen(false)}
      >
        <UserMenuContent
          asRole={asRole}
          dmRole={dmRole}
          error={error}
          inlineEventStream={<EventStreamMessages />}
          isLoading={isLoading}
          isSidebarAvailable={isSidebarAvailable}
          isSidebarOpen={isSidebarOpen}
          unreadCount={countWhenOpened}
          username={user.username}
          onEventStreamToggle={() => {
            setSidebarOpen((previous) => !previous);
            // The stream is what the caller came for, so the panel gets out of its way.
            setOpen(false);
          }}
        />
      </AnchoredMenuPanel>
    </Box>
  );
};
