import { useState } from "react";

import { Button } from "@mui/material";

import { AppScaffold } from "../../stories/decorators";
import { SearchMenu, type SearchMenuSection } from "./SearchMenu";

/**
 * Stories use rows without `href` only. A linked row would need a router context to mount, and what
 * a link does is covered at the acceptance seam where a real router exists.
 */
const catalogue = [
  { heading: "Recent (2)", names: ["Screening Backlog", "Assay Triage"] },
  {
    heading: "All projects (6)",
    names: [
      "Adjuvant Study",
      "Binding Survey",
      "Crystal Review",
      "Docking Sweep",
      "Enzyme Panel",
      "Fragment Library",
    ],
  },
];

const filtered = (search: string): SearchMenuSection[] => {
  const term = search.trim().toLocaleLowerCase();
  return catalogue
    .map(({ heading, names }) => ({
      heading,
      rows: names
        .filter((name) => !term || name.toLocaleLowerCase().includes(term))
        .map((name) => ({ id: name, primary: name, secondary: `Unit · Organisation` })),
    }))
    .filter(({ rows }) => rows.length > 0);
};

/**
 * A long list in two headed sections, one row of which is where the caller already is. The story
 * owns the search state and filters for real, so typing behaves as it does in the application.
 */
export const Sectioned = () => {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState("");

  return (
    <AppScaffold>
      <SearchMenu
        ariaLabel="Change project"
        currentHint="The project in the address bar"
        currentId="Crystal Review"
        emptyLabel={(term) => `No project matches “${term}”.`}
        footerNote="Opens Results"
        isPending={false}
        listLabel="Projects"
        pendingLabel="Loading projects…"
        renderTrigger={(bind) => <Button {...bind}>Acceptance Project</Button>}
        search={search}
        searchLabel="Search projects"
        searchPlaceholder="Project, unit or organisation"
        sections={filtered(search)}
        onSearchChange={setSearch}
        onSelect={(row) => setChosen(row.id)}
      />
      <form hidden>
        <input readOnly data-testid="chosen" value={chosen} />
      </form>
    </AppScaffold>
  );
};

export interface PendingProps {
  isPending?: boolean;
}

/**
 * The list has not answered yet, so the caller is told it is loading rather than shown an empty list
 * that would read as having nothing. Parametric so a test can watch it resolve without re-opening
 * the menu.
 */
export const Pending = ({ isPending = true }: PendingProps) => {
  const [search, setSearch] = useState("");

  return (
    <AppScaffold>
      <SearchMenu
        ariaLabel="Change organisation"
        currentHint="The organisation you are working as"
        emptyLabel={(term) => `No organisation matches “${term}”.`}
        footerNote="Opens Home"
        isPending={isPending}
        listLabel="Organisations"
        pendingLabel="Loading organisations…"
        renderTrigger={(bind) => <Button {...bind}>Choose organisation</Button>}
        search={search}
        searchLabel="Search organisations"
        searchPlaceholder="Organisation"
        sections={
          isPending
            ? []
            : [{ rows: [{ id: "org-1", primary: "Acceptance Organisation", secondary: "org-1" }] }]
        }
        onSearchChange={setSearch}
        onSelect={() => undefined}
      />
    </AppScaffold>
  );
};

/**
 * A search that matches nothing, so what did not match is named rather than left to be guessed at.
 */
export const Empty = () => {
  const [search, setSearch] = useState("no such project");

  return (
    <AppScaffold>
      <SearchMenu
        ariaLabel="Change project"
        currentHint="The project in the address bar"
        emptyLabel={(term) => `No project matches “${term}”.`}
        footerNote="Opens Files"
        isPending={false}
        listLabel="Projects"
        pendingLabel="Loading projects…"
        renderTrigger={(bind) => <Button {...bind}>Acceptance Project</Button>}
        search={search}
        searchLabel="Search projects"
        searchPlaceholder="Project, unit or organisation"
        sections={[]}
        onSearchChange={setSearch}
        onSelect={() => undefined}
      />
    </AppScaffold>
  );
};

const organisations = [
  { id: "org-acceptance", name: "Acceptance Organisation" },
  { id: "org-partner", name: "Partner Organisation" },
  { id: "org-default", name: "Default Organisation" },
];

/**
 * One unheaded section, which is the organisation switcher's shape: no groups to announce, and
 * choosing a row is a selection rather than a navigation.
 */
export const Unheaded = () => {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState("");
  const term = search.trim().toLocaleLowerCase();
  const rows = organisations
    .filter(({ name }) => !term || name.toLocaleLowerCase().includes(term))
    .map(({ id, name }) => ({ id, primary: name, secondary: id }));

  return (
    <AppScaffold>
      <SearchMenu
        ariaLabel="Change organisation"
        currentHint="The organisation you are working as"
        currentId="org-partner"
        emptyLabel={(value) => `No organisation matches “${value}”.`}
        footerNote="Opens Home"
        isPending={false}
        listLabel="Organisations"
        pendingLabel="Loading organisations…"
        renderTrigger={(bind) => <Button {...bind}>Partner Organisation</Button>}
        search={search}
        searchLabel="Search organisations"
        searchPlaceholder="Organisation"
        sections={rows.length > 0 ? [{ rows }] : []}
        onSearchChange={setSearch}
        onSelect={(row) => setChosen(row.id)}
      />
      <form hidden>
        <input readOnly data-testid="chosen" value={chosen} />
      </form>
    </AppScaffold>
  );
};
