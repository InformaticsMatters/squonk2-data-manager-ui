# Context

The vocabulary this application uses. When naming things in code, comments, UI copy or commit
messages, use the term defined here rather than a synonym.

## Domain resources

- **Organisation** — the top of the Account Server's ownership tree, and this application's
  identity. The current organisation is the only domain scope persisted between visits. Changing it
  leaves the current resource and navigates Home before the new identity is shown.
- **Unit** — an organisation's billing container. A unit is _billing context_, not a browsing scope:
  it is chosen while creating a project or uploading a dataset, and never appears in a URL as a
  scope. A **personal unit** is the caller's own unit in the **default organisation**; both are
  resolved from the generated resources that declare them, never from a name.
- **Project** — a Data Manager project: files, executions, membership, and a linked subscription.
  Every project a screen displays is the one in the URL.
- **Subscription** — the user-facing name for an Account Server **product**. "Product ID" is
  retained in technical details and route contracts; everywhere else, say subscription.
- **Dataset** and **version** — a dataset is caller-accessible globally; a version is the thing
  actually displayed, and a dataset-only URL canonicalises to its resolved current version.
- **Onboarding** — the offer the Projects index makes to a caller with no project of their own and
  nowhere else they can work: it explains the hierarchy, creates their **personal unit**, and hands
  off to project creation. It is an offer on the index, never a destination of its own. A caller who
  has a project they can write to may **dismiss** it; a caller who has none may not, because it is
  their only way in.
- **Instance**, **task**, **running workflow** — the three kinds of result a project owns. Together
  they are **Results**; individually, never call one of them a "job run".

## Workspaces and sections

- **Workspace** — one of the three primary destinations: **Project**, **Datasets**,
  **Administration**. Not "tab", not "area". The Project workspace holds one project's sections, so
  it keeps the singular; its main-navigation entry is labelled **Projects** because it opens the
  index of many.
- **Section** — the second tier inside a workspace. A project has **Files**, **Run**, **Results**
  and **Manage**; Administration has **Organisation & access**, **Subscriptions**, **Charges** and
  **Usage & inventory**. These are sections, not tabs, even where they are presented as tabs.
- **Project selector** — the project identity in the identity strip, opened as a menu of the
  organisation's projects, narrowed by searching project, unit and organisation names. Choosing one
  is a **navigation** to that project's canonical route in the section the caller is already
  standing in, never a selection: nothing holds a chosen project.

## Routing and scope

- **Family** — a vertical route-family module (`src/projects`, `src/datasets`,
  `src/administration`) that owns its own parsing, canonicalisation, links, queries, capabilities,
  commands and failures. See `docs/adr/0002-vertical-route-family-modules.md`.
- **Canonical route** — the one URL that addresses a given resource and view state. Convenience
  entry routes **canonicalise** to it with replace-navigation.
- **Query allowlist** — the explicit set of query keys a family owns. Unknown keys never affect
  fetching and are removed; invalid optional values revert to omitted defaults.
- **Page policy** — the closed declarative description of how a page is composed: `public`,
  `application`, or a named family and section. Pages declare one; they do not configure layout,
  authentication or providers themselves.
- **Chrome** — the parts of the application that persist across every navigation: the masthead,
  workspace navigation, project identity strip, footer and event stream sidebar. The chrome is
  mounted once by the page composition, above every boundary a navigation discards, so a workspace
  or section change replaces only the content region. See
  `docs/adr/0004-persistent-chrome-belongs-to-composition.md`.
- **Local not-found** — a missing child beneath a parent the caller may see. The parent's shell is
  retained and the failure is stated inside it, which is what distinguishes it from a missing
  parent.

## Capabilities and facts

- **Facts** — the concrete generated resources, memberships and realm roles an evaluator reads.
  Facts are **current** or **stale**; stale facts confirm nothing about authority.
- **Capability** — what one named action evaluates to for one caller over one resource: `enabled`,
  `disabled` with a reason, or `hidden`. A capability controls presentation and safe interaction,
  never security. See `docs/adr/0003-capabilities-are-presentation.md`.
- **Unconfirmed** — facts insufficient to establish authority. An ordinary action stays available
  and names what the server will confirm; only exclusively platform-administrator actions hide.

## Terms to avoid

- **"Selected project" / "current project" / "context"** — there is no selected scope. Say _the URL
  project_, or _the project in the address bar_. The old Settings modal and its context selection
  no longer exist.
- **"Settings"** — removed. Management lives in **Administration** and project **Manage**.
- **"Data tab" / "Apps/Jobs tab"** — say **Files** and **Run**.
