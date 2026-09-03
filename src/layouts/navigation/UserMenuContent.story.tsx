import { useState } from "react";

import { Paper, Typography } from "@mui/material";

import { AppScaffold } from "../../stories/decorators";
import { UserMenuContent, type UserMenuContentProps } from "./UserMenuContent";

/**
 * The panel is only ever rendered at a fixed width inside an elevated surface, and the footer's
 * clipping only means anything at that width, so the stories reproduce it.
 */
const Panel = ({ children }: { children: React.ReactNode }) => (
  <Paper elevation={8} sx={{ width: 320, overflow: "hidden" }}>
    {children}
  </Paper>
);

export interface SignedInProps extends Partial<
  Pick<UserMenuContentProps, "asRole" | "dmRole" | "unreadCount" | "username">
> {
  isSidebarAvailable?: boolean;
}

/**
 * The ordinary case: a signed-in caller on a screen wide enough for the sidebar. The story owns
 * the sidebar state so the toggle reads as it does in the application, and records each toggle.
 */
export const SignedIn = ({
  username = "odudgeon",
  dmRole = "data-manager-admin",
  asRole = "account-server-admin",
  unreadCount = 7,
  isSidebarAvailable = true,
}: SignedInProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toggles, setToggles] = useState(0);

  return (
    <AppScaffold>
      <Panel>
        <UserMenuContent
          asRole={asRole}
          dmRole={dmRole}
          inlineEventStream={<Typography>Inline event stream</Typography>}
          isSidebarAvailable={isSidebarAvailable}
          isSidebarOpen={isSidebarOpen}
          unreadCount={unreadCount}
          username={username}
          onEventStreamToggle={() => {
            setIsSidebarOpen((open) => !open);
            setToggles((count) => count + 1);
          }}
        />
      </Panel>
      <form hidden>
        <input readOnly data-testid="toggles" value={String(toggles)} />
        <input readOnly data-testid="sidebar-open" value={String(isSidebarOpen)} />
      </form>
    </AppScaffold>
  );
};

/** Nobody is signed in, so the panel offers the one thing that can be done about that. */
export const SignedOut = () => (
  <AppScaffold>
    <Panel>
      <UserMenuContent
        isSidebarAvailable
        isSidebarOpen={false}
        unreadCount={0}
        onEventStreamToggle={() => undefined}
      />
    </Panel>
  </AppScaffold>
);

/** The session could not be read, which is reported rather than shown as a signed-out menu. */
export const Failed = () => (
  <AppScaffold>
    <Panel>
      <UserMenuContent
        isSidebarAvailable
        error={new Error("Your session has expired")}
        isSidebarOpen={false}
        unreadCount={0}
        onEventStreamToggle={() => undefined}
      />
    </Panel>
  </AppScaffold>
);

/** The session is still being read. */
export const Loading = () => (
  <AppScaffold>
    <Panel>
      <UserMenuContent
        isLoading
        isSidebarAvailable
        isSidebarOpen={false}
        unreadCount={0}
        onEventStreamToggle={() => undefined}
      />
    </Panel>
  </AppScaffold>
);
