/**
 * The application's iconography: the source of the design document `docs/iconography/index.html`.
 *
 * Edit this file, then run `pnpm docs:iconography` to regenerate the HTML. The generator fails on a
 * Lucide glyph name that does not exist, and TypeScript fails on a usage naming an unknown concept.
 *
 * - A **concept** is one idea in the application (Project, Delete, Failed…) and has exactly one glyph.
 *   Functions use concepts, never glyphs, so a concept cannot be drawn two ways.
 * - A **function** is something the application does, listed with the pages it appears on and each
 *   element that carries an icon.
 * - A **design rule** applies to every icon (`designRules`); an undecided matter is an open question.
 *
 * Adding a function: add it to its area in `areas`, give each element a concept (every primary action button included), and add a concept
 * (status `proposed`) only when no existing one means the same thing. Changing a glyph: change the
 * concept, and every function using it follows.
 *
 * `was` records the Material icon an element used before the move to Lucide (issue #200). Leave it
 * off new elements.
 */

/** A Lucide glyph name (`lucide-static` icon file name), or a plain coloured dot drawn without an icon. */
export type Glyph = string | { dot: string };

/** `decided`: agreed in review. `proposed`: awaiting review. `open`: the glyph is still undecided. */
export type Status = "decided" | "open" | "proposed";

export interface Concept {
  group: string;
  label: string;
  glyph: Glyph;
  status: Status;
  alternatives?: string[];
  note?: string;
}

const PLACES = "Places and resources";
const SECTIONS = "Project sections";
const DEFINITIONS = "Definitions and results";
const STATUS = "Status";
const SEVERITY = "Severity (alerts)";
const ROLES = "Roles and privacy";
const FILES = "Files and their kinds";
const ACTIONS = "Actions";
const CONTROLS = "Navigation and controls";
const SCHEMES = "Colour schemes";

export const concepts = {
  // Places and resources
  home: { group: PLACES, label: "Home", glyph: "house", status: "decided" },
  documentation: {
    group: PLACES,
    label: "Documentation",
    glyph: "book-open",
    status: "decided",
    alternatives: ["book-open-text", "library"],
  },
  organisation: {
    group: PLACES,
    label: "Organisation",
    glyph: "landmark",
    status: "decided",
    alternatives: ["building-2", "building"],
  },
  administration: {
    group: PLACES,
    label: "Administration (main nav)",
    glyph: "settings",
    status: "decided",
    alternatives: ["settings-2", "sliders-vertical", "toolbox"],
    note: "A settings page for the organisation, its units and their subscriptions. Distinct from the Manage section of a project (wrench), the Organisation (landmark) and Task (cog, a spoked wheel rather than this gear). Earlier rejected: building-2, layout-dashboard, gauge, briefcase-business, id-card, clipboard-list, network, shield-user, user-cog.",
  },
  unit: {
    group: PLACES,
    label: "Unit",
    glyph: "container",
    status: "decided",
    alternatives: ["users", "boxes"],
  },
  personalUnit: {
    group: PLACES,
    label: "Personal unit",
    glyph: "user",
    status: "decided",
    alternatives: ["user-round", "circle-user"],
  },
  person: {
    group: PLACES,
    label: "Person / user",
    glyph: "user",
    status: "decided",
    alternatives: ["user-round"],
  },
  project: {
    group: PLACES,
    label: "Project",
    glyph: "folder-kanban",
    status: "decided",
    alternatives: ["briefcase", "box", "folder-git-2"],
    note: "Distinct from a plain directory (folder).",
  },
  dataset: {
    group: PLACES,
    label: "Dataset",
    glyph: "database",
    status: "decided",
    alternatives: ["database-zap", "table-2"],
  },
  subscription: {
    group: PLACES,
    label: "Subscription",
    glyph: "credit-card",
    status: "decided",
    alternatives: ["badge-check", "calendar-sync", "ticket"],
  },
  access: {
    group: PLACES,
    label: "Access",
    glyph: "key-round",
    status: "decided",
    alternatives: ["shield", "user-cog"],
  },
  charges: {
    group: PLACES,
    label: "Charges",
    glyph: "receipt",
    status: "decided",
    alternatives: ["wallet", "banknote"],
  },
  processing: {
    group: PLACES,
    label: "Processing (compute)",
    glyph: "cpu",
    status: "decided",
    alternatives: ["server", "zap"],
  },
  storage: {
    group: PLACES,
    label: "Storage",
    glyph: "hard-drive",
    status: "decided",
    alternatives: ["archive", "server"],
  },
  coins: {
    group: PLACES,
    label: "Coins",
    glyph: "coins",
    status: "decided",
    alternatives: ["circle-dollar-sign"],
  },
  usage: {
    group: PLACES,
    label: "Usage & Inventory",
    glyph: "chart-column",
    status: "decided",
    alternatives: ["chart-bar", "clipboard-list"],
  },
  burnRate: {
    group: PLACES,
    label: "Burn rate",
    glyph: "trending-up",
    status: "decided",
    alternatives: ["flame"],
  },
  predictedSpend: {
    group: PLACES,
    label: "Predicted spend",
    glyph: "chart-line",
    status: "decided",
    alternatives: ["chart-spline", "calculator"],
  },
  account: {
    group: PLACES,
    label: "Account",
    glyph: "circle-user",
    status: "decided",
    alternatives: ["user-round"],
  },
  eventStream: {
    group: PLACES,
    label: "Event stream",
    glyph: "activity",
    status: "decided",
    alternatives: ["bell", "radio"],
  },

  // Project sections
  files: {
    group: SECTIONS,
    label: "Files (section)",
    glyph: "folder",
    status: "decided",
    alternatives: ["folder-open", "files"],
    note: "Same glyph as Directory: the section is the project's directory tree.",
  },
  run: {
    group: SECTIONS,
    label: "Run",
    glyph: "play",
    status: "decided",
    alternatives: ["circle-play", "rocket"],
  },
  results: {
    group: SECTIONS,
    label: "Results",
    glyph: "history",
    status: "decided",
    alternatives: ["list-checks", "clipboard-list"],
  },
  manage: {
    group: SECTIONS,
    label: "Manage",
    glyph: "wrench",
    status: "decided",
    alternatives: ["settings", "sliders-horizontal"],
  },

  // Definitions and results
  workflow: {
    group: DEFINITIONS,
    label: "Workflow",
    glyph: "workflow",
    status: "decided",
    alternatives: ["git-fork", "network"],
  },
  application: {
    group: DEFINITIONS,
    label: "Application",
    glyph: "app-window",
    status: "decided",
    alternatives: ["layout-grid", "monitor-cog"],
  },
  job: {
    group: DEFINITIONS,
    label: "Job",
    glyph: "square-function",
    status: "decided",
    alternatives: ["flask-conical", "test-tube"],
  },
  task: {
    group: DEFINITIONS,
    label: "Task",
    glyph: "cog",
    status: "decided",
    alternatives: ["list-todo", "hourglass"],
  },
  exitCode: {
    group: DEFINITIONS,
    label: "Exit code",
    glyph: "square-terminal",
    status: "decided",
    alternatives: ["terminal"],
  },
  logs: {
    group: DEFINITIONS,
    label: "Logs",
    glyph: "scroll-text",
    status: "decided",
    alternatives: ["logs", "file-terminal"],
  },
  time: { group: DEFINITIONS, label: "Start / finish time", glyph: "clock", status: "decided" },
  duration: {
    group: DEFINITIONS,
    label: "Duration",
    glyph: "timer",
    status: "decided",
    alternatives: ["hourglass"],
  },

  // Status
  queued: {
    group: STATUS,
    label: "Queued / pending",
    glyph: "circle-dashed",
    status: "decided",
    alternatives: ["clock"],
  },
  running: {
    group: STATUS,
    label: "Running (animated)",
    glyph: "loader-circle",
    status: "decided",
    alternatives: ["loader", "refresh-cw"],
  },
  deleting: { group: STATUS, label: "Deleting", glyph: "circle-minus", status: "decided" },
  succeeded: {
    group: STATUS,
    label: "Succeeded",
    glyph: "circle-check",
    status: "decided",
    alternatives: ["circle-check-big"],
  },
  failed: {
    group: STATUS,
    label: "Failed",
    glyph: "circle-x",
    status: "decided",
    alternatives: ["octagon-x"],
  },
  stopped: {
    group: STATUS,
    label: "Stopped by user",
    glyph: "circle-stop",
    status: "decided",
    alternatives: ["circle-pause"],
  },
  unknown: {
    group: STATUS,
    label: "Unknown status",
    glyph: "circle-question-mark",
    status: "decided",
    alternatives: ["circle-dot-dashed"],
  },
  connected: {
    group: STATUS,
    label: "Event stream connected",
    glyph: { dot: "#2e7d32" },
    status: "decided",
    note: "A coloured dot beside the status text, not an icon.",
  },
  reconnecting: {
    group: STATUS,
    label: "Event stream connecting / reconnecting",
    glyph: { dot: "#ed6c02" },
    status: "decided",
    note: "A coloured dot beside the status text, not an icon. Pulses while connecting.",
  },
  disconnected: {
    group: STATUS,
    label: "Event stream disconnected",
    glyph: { dot: "#d32f2f" },
    status: "decided",
    note: "A coloured dot beside the status text, not an icon.",
  },
  available: {
    group: STATUS,
    label: "Available",
    glyph: "check",
    status: "decided",
    alternatives: ["circle-check"],
  },
  unavailable: {
    group: STATUS,
    label: "Unavailable",
    glyph: "ban",
    status: "decided",
    alternatives: ["circle-slash"],
  },

  // Severity
  info: { group: SEVERITY, label: "Info", glyph: "info", status: "decided" },
  success: { group: SEVERITY, label: "Success", glyph: "circle-check", status: "decided" },
  warning: { group: SEVERITY, label: "Warning", glyph: "triangle-alert", status: "decided" },
  error: {
    group: SEVERITY,
    label: "Error",
    glyph: "circle-alert",
    status: "decided",
    alternatives: ["octagon-alert"],
  },

  // Roles and privacy
  administrator: {
    group: ROLES,
    label: "Administrator (role)",
    glyph: "shield-check",
    status: "decided",
    alternatives: ["shield-user", "crown"],
  },
  editor: {
    group: ROLES,
    label: "Editor (role)",
    glyph: "user-pen",
    status: "decided",
    alternatives: ["pencil"],
    note: "Not the Edit action's pencil, so a role is not mistaken for a button.",
  },
  observer: { group: ROLES, label: "Observer (role)", glyph: "eye", status: "decided" },
  creator: {
    group: ROLES,
    label: "Creator (role)",
    glyph: "sparkles",
    status: "decided",
    alternatives: ["crown", "user-star"],
  },
  evaluation: {
    group: ROLES,
    label: "Evaluation access",
    glyph: "hourglass",
    status: "decided",
    alternatives: ["flask-round"],
  },
  private: { group: ROLES, label: "Private", glyph: "lock", status: "decided" },
  public: {
    group: ROLES,
    label: "Public",
    glyph: "globe",
    status: "decided",
    alternatives: ["lock-open"],
  },

  // Files and their kinds
  directory: { group: FILES, label: "Directory", glyph: "folder", status: "decided" },
  managedFile: {
    group: FILES,
    label: "Managed file",
    glyph: "file-symlink",
    status: "decided",
    alternatives: ["file-lock"],
    note: "A file attached from a dataset version: the project holds a link to the dataset. It is detached, never deleted, and cannot be renamed. Marks the row beside its file-type glyph.",
  },
  unmanagedFile: {
    group: FILES,
    label: "Unmanaged file",
    glyph: "file",
    status: "decided",
    note: "A file that exists only in the project. It can be renamed and deleted outright. Carries no marker: its file-type glyph alone says it is an ordinary file.",
  },
  file: { group: FILES, label: "File (generic)", glyph: "file", status: "decided" },
  textFile: { group: FILES, label: "Text / log file", glyph: "file-text", status: "decided" },
  tableFile: {
    group: FILES,
    label: "Table file (CSV, TSV, XLSX)",
    glyph: "file-spreadsheet",
    status: "decided",
  },
  structuredFile: {
    group: FILES,
    label: "Structured file (JSON, YAML, XML)",
    glyph: "file-braces",
    status: "decided",
    alternatives: ["file-code"],
  },
  archiveFile: {
    group: FILES,
    label: "Archive (zip, tar)",
    glyph: "file-archive",
    status: "decided",
  },
  imageFile: { group: FILES, label: "Image file", glyph: "file-image", status: "decided" },
  notebookFile: {
    group: FILES,
    label: "Notebook (.ipynb)",
    glyph: "notebook",
    status: "decided",
    alternatives: ["notebook-pen"],
  },
  molecule: {
    group: FILES,
    label: "Molecule / chemistry file (custom)",
    glyph: "molecule",
    status: "decided",
    alternatives: ["hexagon", "atom"],
    note: "Custom glyph: Lucide has no molecule. Used for SDF, MOL, SMILES, PDB and the molecules input type.",
  },
  value: {
    group: FILES,
    label: "Value input (non-file)",
    glyph: "text-cursor-input",
    status: "decided",
    alternatives: ["variable"],
  },
  textViewer: {
    group: FILES,
    label: "Text viewer",
    glyph: "letter-text",
    status: "decided",
    alternatives: ["text-search", "file-text"],
    note: "Not the text-file glyph: a viewer is a way of looking, not a kind of file.",
  },
  browserViewer: {
    group: FILES,
    label: "Browser viewer",
    glyph: "monitor",
    status: "decided",
    alternatives: ["panel-top"],
  },
  schema: {
    group: FILES,
    label: "Schema",
    glyph: "table-properties",
    status: "decided",
    alternatives: ["sheet"],
  },
  label: { group: FILES, label: "Label", glyph: "tag", status: "decided" },

  // Actions
  add: {
    group: ACTIONS,
    label: "Add / create",
    glyph: "plus",
    status: "decided",
    alternatives: ["circle-plus"],
  },
  createDirectory: {
    group: ACTIONS,
    label: "Create directory",
    glyph: "folder-plus",
    status: "decided",
  },
  uploadFile: {
    group: ACTIONS,
    label: "Upload unmanaged file",
    glyph: "file-up",
    status: "decided",
    alternatives: ["upload"],
  },
  uploadDataset: {
    group: ACTIONS,
    label: "Upload dataset",
    glyph: "cloud-upload",
    status: "decided",
    alternatives: ["database-backup"],
  },
  newVersion: {
    group: ACTIONS,
    label: "New dataset version",
    glyph: "file-plus-2",
    status: "decided",
    alternatives: ["layers", "git-branch-plus"],
  },
  createDataset: {
    group: ACTIONS,
    label: "Create dataset from file",
    glyph: "database-plus",
    status: "decided",
  },
  attach: {
    group: ACTIONS,
    label: "Attach dataset to project",
    glyph: "paperclip",
    status: "decided",
    alternatives: ["link"],
  },
  detach: {
    group: ACTIONS,
    label: "Detach managed file",
    glyph: "unlink",
    status: "decided",
    alternatives: ["link-2-off"],
    note: "Breaks a managed file's link: the dataset is untouched. Pairs with the Managed file glyph, and is never the Delete bin.",
  },
  delete: {
    group: ACTIONS,
    label: "Delete",
    glyph: "trash-2",
    status: "decided",
    alternatives: ["file-x"],
    note: "Destroys something: an unmanaged file, a directory, a dataset, a project. file-x is the alternative if deleting an unmanaged file should differ from every other delete.",
  },
  rename: {
    group: ACTIONS,
    label: "Rename",
    glyph: "pencil-line",
    status: "decided",
    alternatives: ["text-cursor"],
  },
  edit: { group: ACTIONS, label: "Edit", glyph: "pencil", status: "decided" },
  save: { group: ACTIONS, label: "Save", glyph: "save", status: "decided" },
  clear: {
    group: ACTIONS,
    label: "Clear",
    glyph: "eraser",
    status: "decided",
    alternatives: ["x"],
  },
  restore: {
    group: ACTIONS,
    label: "Restore original",
    glyph: "undo-2",
    status: "decided",
    alternatives: ["rotate-ccw"],
  },
  download: { group: ACTIONS, label: "Download", glyph: "download", status: "decided" },
  copy: { group: ACTIONS, label: "Copy", glyph: "copy", status: "decided" },
  refresh: { group: ACTIONS, label: "Refresh", glyph: "refresh-cw", status: "decided" },
  retry: {
    group: ACTIONS,
    label: "Retry",
    glyph: "rotate-cw",
    status: "decided",
    alternatives: ["refresh-cw"],
  },
  rerun: {
    group: ACTIONS,
    label: "Run again",
    glyph: "repeat",
    status: "decided",
    alternatives: ["rotate-ccw", "refresh-ccw-dot"],
  },
  stop: {
    group: ACTIONS,
    label: "Stop / terminate",
    glyph: "square",
    status: "decided",
    alternatives: ["circle-stop", "octagon-x"],
  },
  open: {
    group: ACTIONS,
    label: "Open result",
    glyph: "maximize-2",
    status: "decided",
    alternatives: ["arrow-up-right", "panel-right-open"],
  },
  archive: { group: ACTIONS, label: "Archive / archived", glyph: "archive", status: "decided" },
  unarchive: { group: ACTIONS, label: "Unarchive", glyph: "archive-restore", status: "decided" },
  favourite: {
    group: ACTIONS,
    label: "Favourite (filled when on)",
    glyph: "star",
    status: "decided",
  },
  search: { group: ACTIONS, label: "Search", glyph: "search", status: "decided" },
  externalLink: {
    group: ACTIONS,
    label: "External link",
    glyph: "external-link",
    status: "decided",
    alternatives: ["square-arrow-out-up-right"],
  },
  signIn: { group: ACTIONS, label: "Sign in", glyph: "log-in", status: "decided" },
  signOut: { group: ACTIONS, label: "Sign out", glyph: "log-out", status: "decided" },
  moveUp: { group: ACTIONS, label: "Move up (form arrays)", glyph: "arrow-up", status: "decided" },
  moveDown: {
    group: ACTIONS,
    label: "Move down (form arrays)",
    glyph: "arrow-down",
    status: "decided",
  },

  // Navigation and controls
  back: { group: CONTROLS, label: "Back", glyph: "arrow-left", status: "decided" },
  contains: {
    group: CONTROLS,
    label: "Contains (hierarchy arrow)",
    glyph: "arrow-right",
    status: "decided",
    alternatives: ["chevron-right"],
  },
  previous: { group: CONTROLS, label: "Previous", glyph: "chevron-left", status: "decided" },
  next: { group: CONTROLS, label: "Next / row link", glyph: "chevron-right", status: "decided" },
  expand: { group: CONTROLS, label: "Expand", glyph: "chevron-down", status: "decided" },
  collapse: { group: CONTROLS, label: "Collapse", glyph: "chevron-up", status: "decided" },
  dropdown: { group: CONTROLS, label: "Dropdown", glyph: "chevron-down", status: "decided" },
  close: { group: CONTROLS, label: "Close / remove", glyph: "x", status: "decided" },
  check: { group: CONTROLS, label: "Check / current / member", glyph: "check", status: "decided" },
  sort: {
    group: CONTROLS,
    label: "Sort direction",
    glyph: "arrow-down",
    status: "decided",
    alternatives: ["arrow-down-up"],
  },
  checkbox: { group: CONTROLS, label: "Checkbox", glyph: "square", status: "decided" },
  checkboxChecked: {
    group: CONTROLS,
    label: "Checkbox checked",
    glyph: "square-check",
    status: "decided",
    alternatives: ["square-check-big"],
  },
  checkboxPartial: {
    group: CONTROLS,
    label: "Checkbox partial",
    glyph: "square-minus",
    status: "decided",
  },
  radio: { group: CONTROLS, label: "Radio", glyph: "circle", status: "decided" },
  radioChecked: {
    group: CONTROLS,
    label: "Radio selected",
    glyph: "circle-dot",
    status: "decided",
  },

  // Colour schemes
  lightMode: { group: SCHEMES, label: "Theme: light", glyph: "sun", status: "decided" },
  systemMode: { group: SCHEMES, label: "Theme: auto", glyph: "sun-moon", status: "decided" },
  darkMode: { group: SCHEMES, label: "Theme: dark", glyph: "moon", status: "decided" },
} satisfies Record<string, Concept>;

export type ConceptKey = keyof typeof concepts;

export interface Usage {
  /** What on the page carries the icon. */
  element: string;
  concepts: ConceptKey | ConceptKey[];
  /** The Material icon this element used before the move to Lucide. */
  was?: string;
  /** For an element that had no icon before the move: how much the icon was needed. */
  priority?: "high" | "medium";
}

export interface AppFunction {
  name: string;
  /** The pages the function appears on, by name and route — not by component. */
  pages: string[];
  usages: Usage[];
}

export interface Area {
  title: string;
  functions: AppFunction[];
}

const page = {
  every: "Every page (masthead)",
  signedIn: "Every signed-in page (masthead)",
  home: "Home (/)",
  docs: "Documentation (/docs/…)",
  projects: "Projects index (/projects)",
  newProject: "New project (/projects/new)",
  deletion: "Project deletion progress (/projects/deletions/:taskId)",
  strip: "Every project page (project strip)",
  files: "Project › Files (/projects/:id/files)",
  fileView: "Project › File viewer (/projects/:id/files/view)",
  run: "Project › Run (/projects/:id/run)",
  runDialog: "Project › Run › definition dialog; Results › Run again",
  results: "Project › Results (/projects/:id/results)",
  resultDetail: "Project › Results › result detail dialog",
  manage: "Project › Manage (/projects/:id/manage)",
  datasets: "Datasets (/datasets)",
  datasetDetail: "Datasets › dataset version dialog",
  datasetView: "Datasets › version viewer",
  adminRail: "Administration (left rail, every page)",
  adminOverview: "Administration › Overview (/administration)",
  adminUnit: "Administration › Unit (/administration/units/:unitId/…)",
  adminSubs: "Administration › Unit › Subscriptions",
  adminCharges: "Administration › Charges (organisation, unit, subscription)",
  adminUsage: "Administration › Usage & Inventory",
  everyForm: "Every form, filter and table",
  everyAlert: "Every page — errors, notices, capability reasons",
  everyDialog: "Every dialog",
};

export const areas: Area[] = [
  {
    title: "Global shell",
    functions: [
      {
        name: "Main navigation",
        pages: [page.every],
        usages: [
          { element: "Projects link", concepts: "project", priority: "high" },
          { element: "Datasets link", concepts: "dataset", priority: "high" },
          { element: "Administration link", concepts: "administration", priority: "high" },
          { element: "Home link (signed out)", concepts: "home", priority: "high" },
          {
            element: "Documentation link (signed out)",
            concepts: "documentation",
            priority: "high",
          },
        ],
      },
      {
        name: "Organisation switcher",
        pages: [page.signedIn],
        usages: [
          { element: "Organisation name", concepts: "organisation", priority: "high" },
          { element: "Dropdown affordance", concepts: "dropdown", was: "KeyboardArrowDownRounded" },
          { element: "Menu search", concepts: "search", was: "SearchRounded" },
          { element: "Current organisation", concepts: "check", was: "CheckRounded" },
        ],
      },
      {
        name: "Account menu",
        pages: [page.every],
        usages: [
          { element: "Account button", concepts: "account", was: "AccountCircle" },
          { element: "Theme: light", concepts: "lightMode", was: "LightMode" },
          { element: "Theme: auto", concepts: "systemMode", was: "SettingsBrightness" },
          { element: "Theme: dark", concepts: "darkMode", was: "DarkMode" },
          { element: "Sign in", concepts: "signIn", priority: "medium" },
          { element: "Sign out", concepts: "signOut", priority: "medium" },
          { element: "Show / hide event stream", concepts: "eventStream", priority: "medium" },
        ],
      },
      {
        name: "Event stream",
        pages: [page.signedIn],
        usages: [
          { element: "Close sidebar", concepts: "close", was: "Close" },
          { element: "Status: connected", concepts: "connected", was: "FiberManualRecord" },
          {
            element: "Status: connecting / reconnecting",
            concepts: "reconnecting",
            was: "FiberManualRecord",
          },
          { element: "Status: disconnected", concepts: "disconnected", was: "FiberManualRecord" },
          { element: "Processing charge message", concepts: "processing", priority: "medium" },
          { element: "Storage charge message", concepts: "storage", priority: "medium" },
        ],
      },
      {
        name: "Role banner",
        pages: [page.signedIn],
        usages: [
          { element: "Administrator access mark", concepts: "administrator", priority: "medium" },
          { element: "Evaluation access mark", concepts: "evaluation", priority: "medium" },
        ],
      },
      {
        name: "Cookie notice",
        pages: [page.every],
        usages: [{ element: "I understand", concepts: "check" }],
      },
    ],
  },
  {
    title: "Home and documentation",
    functions: [
      {
        name: "Recent projects",
        pages: [page.home],
        usages: [
          { element: "Each recent project", concepts: "project", priority: "medium" },
          { element: "Open files button", concepts: "files", priority: "medium" },
        ],
      },
      {
        name: "Documentation navigation",
        pages: [page.home, page.docs],
        usages: [
          { element: "Previous page", concepts: "previous", was: "NavigateBeforeRounded" },
          { element: "Next page", concepts: "next", was: "NavigateNextRounded" },
        ],
      },
    ],
  },
  {
    title: "Projects",
    functions: [
      {
        name: "Project index",
        pages: [page.projects],
        usages: [
          { element: "Private project", concepts: "private", was: "LockOutlined" },
          { element: "Public project", concepts: "public", was: "PublicOutlined" },
          { element: "Row link affordance", concepts: "next", was: "ChevronRight" },
          { element: "Create project button", concepts: "add", priority: "high" },
          { element: "Each project row", concepts: "project", priority: "medium" },
          {
            element: "Role chips",
            concepts: ["administrator", "editor", "observer", "creator"],
            priority: "medium",
          },
        ],
      },
      {
        name: "First-project onboarding",
        pages: [`${page.projects} (no projects yet)`],
        usages: [
          { element: "Organisation", concepts: "organisation", was: "BusinessRounded" },
          { element: "Unit", concepts: "unit", was: "InboxRounded" },
          { element: "Project", concepts: "project", was: "FolderRounded" },
          { element: "Contains arrow", concepts: "contains", was: "ArrowForwardRounded" },
          { element: "Create project button", concepts: "add", priority: "medium" },
        ],
      },
      {
        name: "Create project",
        pages: [page.newProject],
        usages: [{ element: "Back to Projects", concepts: "back", priority: "medium" }],
      },
      {
        name: "Personal unit / unit offer",
        pages: [page.projects, page.newProject],
        usages: [
          { element: "Create personal unit", concepts: "personalUnit", priority: "medium" },
          { element: "Create unit", concepts: "unit", priority: "medium" },
          { element: "Create project / Create linked project (submit)", concepts: "add" },
          { element: "Retry", concepts: "retry" },
          { element: "Create unit dialog (submit)", concepts: "add" },
        ],
      },
      {
        name: "Project deletion progress",
        pages: [page.deletion],
        usages: [
          {
            element: "Deletion status",
            concepts: ["running", "succeeded", "failed"],
            priority: "medium",
          },
          { element: "Back to Projects", concepts: "back", priority: "medium" },
          { element: "Retry deletion", concepts: "retry" },
        ],
      },
      {
        name: "Project selector and section tabs",
        pages: [page.strip],
        usages: [
          { element: "Project name", concepts: "project", priority: "medium" },
          { element: "Dropdown affordance", concepts: "dropdown", was: "KeyboardArrowDownRounded" },
          { element: "Menu search", concepts: "search", was: "SearchRounded" },
          { element: "Current project", concepts: "check", was: "CheckRounded" },
          { element: "Files tab", concepts: "files", priority: "high" },
          { element: "Run tab", concepts: "run", priority: "high" },
          { element: "Results tab", concepts: "results", priority: "high" },
          { element: "Manage tab", concepts: "manage", priority: "high" },
        ],
      },
    ],
  },
  {
    title: "Project › Files",
    functions: [
      {
        name: "Browse directories",
        pages: [page.files],
        usages: [
          { element: "Directory row", concepts: "directory", priority: "high" },
          {
            element: "File row, by type",
            concepts: [
              "molecule",
              "textFile",
              "tableFile",
              "structuredFile",
              "archiveFile",
              "imageFile",
              "notebookFile",
              "file",
            ],
            priority: "high",
          },
          { element: "Managed file marker", concepts: "managedFile", priority: "high" },
          { element: "Read-only mode", concepts: "private", priority: "medium" },
          { element: "Expand", concepts: "expand", was: "ExpandMore" },
          { element: "Collapse", concepts: "collapse", was: "ExpandLess" },
          { element: "Sort direction", concepts: "sort", was: "ArrowDownward" },
        ],
      },
      {
        name: "Directory toolbar",
        pages: [page.files],
        usages: [
          { element: "Upload unmanaged file", concepts: "uploadFile", was: "CloudUploadRounded" },
          {
            element: "Create directory",
            concepts: "createDirectory",
            was: "CreateNewFolderRounded",
          },
          { element: "Refresh directory", concepts: "refresh", was: "RefreshRounded" },
        ],
      },
      {
        name: "Directory row actions",
        pages: [page.files],
        usages: [
          { element: "Favourite (on / off)", concepts: "favourite", was: "StarRounded" },
          { element: "Delete directory", concepts: "delete", was: "DeleteForeverRounded" },
          { element: "Rename directory", concepts: "rename", was: "DriveFileRenameOutlineRounded" },
          { element: "Delete confirmation (submit)", concepts: "delete" },
          { element: "Rename / move dialog (submit)", concepts: "rename" },
        ],
      },
      {
        name: "Unmanaged file row actions",
        pages: [page.files],
        usages: [
          { element: "Favourite (on / off)", concepts: "favourite", was: "StarBorderRounded" },
          { element: "Delete file", concepts: "delete", was: "DeleteForeverRounded" },
          { element: "Rename file", concepts: "rename", was: "DriveFileRenameOutlineRounded" },
          { element: "Download", concepts: "download", was: "GetAppRounded" },
          {
            element: "Create dataset from file",
            concepts: "createDataset",
            was: "AddCircleRounded",
          },
          { element: "Delete confirmation (submit)", concepts: "delete" },
          { element: "Rename / move dialog (submit)", concepts: "rename" },
        ],
      },
      {
        name: "Managed file row actions",
        pages: [page.files],
        usages: [
          { element: "Favourite (on / off)", concepts: "favourite", was: "StarRounded" },
          { element: "Detach file", concepts: "detach", was: "DeleteOutlineRounded" },
          { element: "Download", concepts: "download", was: "GetAppRounded" },
          { element: "Detach confirmation (submit)", concepts: "detach" },
        ],
      },
      {
        name: "Open a file in a viewer",
        pages: [page.files, page.resultDetail],
        usages: [
          { element: "Text viewer", concepts: "textViewer", was: "Description" },
          { element: "Browser viewer", concepts: "browserViewer", was: "Description" },
        ],
      },
      {
        name: "File viewer",
        pages: [page.fileView],
        usages: [
          { element: "Back to files", concepts: "back", was: "ArrowBack" },
          { element: "Open in a new tab", concepts: "externalLink", was: "OpenInNew" },
          { element: "Viewer switch: Text", concepts: "textViewer", priority: "medium" },
          { element: "Viewer switch: Browser", concepts: "browserViewer", priority: "medium" },
        ],
      },
    ],
  },
  {
    title: "Project › Run",
    functions: [
      {
        name: "Definition catalogue",
        pages: [page.run],
        usages: [
          { element: "Search", concepts: "search", was: "SearchRounded" },
          { element: "Refresh catalogue", concepts: "refresh", was: "RefreshRounded" },
          { element: "Filter select", concepts: "dropdown", was: "ArrowDropDown" },
          {
            element: "Filter options",
            concepts: ["workflow", "application", "job"],
            priority: "medium",
          },
        ],
      },
      {
        name: "Definition card",
        pages: [page.run],
        usages: [
          { element: "Kind chip", concepts: ["workflow", "application", "job"], priority: "high" },
          { element: "Past runs count", concepts: "results", was: "History" },
          { element: "View documentation", concepts: "externalLink", was: "Launch" },
          { element: "Version menu", concepts: "dropdown", was: "KeyboardArrowDown" },
          { element: "Run button", concepts: "run", priority: "high" },
          { element: "Category / collection lines", concepts: "label", priority: "medium" },
        ],
      },
      {
        name: "Run dialog",
        pages: [page.runDialog],
        usages: [
          { element: "Close dialog", concepts: "close", was: "CloseRounded" },
          { element: "Open sketcher", concepts: "edit", was: "Edit" },
          { element: "Clear molecule", concepts: "clear", was: "DeleteForever" },
          { element: "Run (submit)", concepts: "run", priority: "high" },
          {
            element: "Dialog title, by kind",
            concepts: ["workflow", "application", "job"],
            priority: "medium",
          },
          {
            element: "Input label: file / directory / molecules",
            concepts: ["file", "directory", "molecule"],
            priority: "medium",
          },
          { element: "Options checkboxes", concepts: "checkboxChecked", was: "CheckBox" },
        ],
      },
      {
        name: "Project file picker",
        pages: [page.runDialog],
        usages: [
          { element: "Directory", concepts: "directory", was: "FolderRounded" },
          { element: "Favourite directory", concepts: "favourite", was: "FolderSpecialRounded" },
          {
            element: "File rows, by type",
            concepts: ["molecule", "textFile", "file"],
            priority: "high",
          },
          { element: "Select / close picker", concepts: "files", priority: "medium" },
          { element: "Single-select", concepts: "radioChecked", was: "RadioButtonChecked" },
        ],
      },
    ],
  },
  {
    title: "Project › Results",
    functions: [
      {
        name: "Results list and filters",
        pages: [page.results],
        usages: [
          { element: "Clear definition narrowing", concepts: "close", was: "CloseRounded" },
          { element: "Refresh results", concepts: "refresh", was: "RefreshRounded" },
          { element: "Search", concepts: "search", was: "SearchRounded" },
          {
            element: "Type filter: Tasks / Instances / Workflows",
            concepts: ["task", "job", "workflow"],
            priority: "medium",
          },
        ],
      },
      {
        name: "Result status",
        pages: [page.results, page.resultDetail],
        usages: [
          { element: "Pending", concepts: "queued", was: "FiberManualRecordRounded" },
          {
            element: "Running, copying, formatting, loading",
            concepts: "running",
            was: "FiberManualRecordRounded",
          },
          { element: "Deleting", concepts: "deleting", was: "FiberManualRecordRounded" },
          { element: "Succeeded", concepts: "succeeded", was: "CheckCircleRounded" },
          { element: "Failed", concepts: "failed", was: "ErrorRounded" },
          { element: "Stopped by user", concepts: "stopped", was: "ErrorRounded" },
          { element: "Unknown", concepts: "unknown", was: "FiberManualRecordRounded" },
        ],
      },
      {
        name: "Result card",
        pages: [page.results],
        usages: [
          { element: "Show more / less", concepts: "expand", was: "ExpandMore" },
          { element: "Archived", concepts: "archive", was: "Inventory" },
          {
            element: "Result kind",
            concepts: ["job", "application", "task", "workflow"],
            priority: "high",
          },
          { element: "Start / finish time", concepts: "time", priority: "medium" },
          { element: "Duration", concepts: "duration", priority: "medium" },
        ],
      },
      {
        name: "Result actions",
        pages: [page.results, page.resultDetail],
        usages: [
          { element: "Terminate / Stop", concepts: "stop", priority: "high" },
          { element: "Delete", concepts: "delete", priority: "high" },
          { element: "Run again", concepts: "rerun", priority: "high" },
          { element: "Logs", concepts: "logs", priority: "medium" },
          { element: "Open", concepts: "open", priority: "medium" },
          { element: "Archive", concepts: "archive", priority: "medium" },
          { element: "Unarchive", concepts: "unarchive", priority: "medium" },
          { element: "Terminate / Stop confirmation (submit)", concepts: "stop" },
          { element: "Delete confirmation (submit)", concepts: "delete" },
        ],
      },
      {
        name: "Result detail",
        pages: [page.resultDetail],
        usages: [
          { element: "Coins / cost", concepts: "coins", was: "Payment" },
          { element: "Application ID", concepts: "application", was: "AppsRounded" },
          { element: "Job collection", concepts: "job", was: "WorkOutlineRounded" },
          { element: "Exit code", concepts: "exitCode", was: "ExitToApp" },
          { element: "Input/output: directory", concepts: "directory", was: "FolderRounded" },
          { element: "Input/output: file", concepts: "file", was: "InsertDriveFileRounded" },
          { element: "Input/output: molecules", concepts: "molecule", was: "ScienceRounded" },
          { element: "Input/output: other", concepts: "value", was: "FilterNoneRounded" },
          { element: "Locate in project", concepts: "directory", was: "Folder" },
          { element: "Close dialog", concepts: "close", was: "CloseRounded" },
          {
            element: "Timeline event level",
            concepts: ["info", "warning", "error"],
            priority: "medium",
          },
          {
            element: "Workflow step status",
            concepts: ["queued", "running", "succeeded", "failed"],
            priority: "medium",
          },
        ],
      },
    ],
  },
  {
    title: "Project › Manage",
    functions: [
      {
        name: "Project identity",
        pages: [page.manage],
        usages: [
          { element: "Project", concepts: "project", was: "FolderOutlined" },
          { element: "Private chip", concepts: "private", was: "LockOutlined" },
          { element: "Public chip", concepts: "public", was: "PublicOutlined" },
          {
            element: "Organisation › Unit path",
            concepts: ["organisation", "unit"],
            priority: "medium",
          },
          {
            element: "Role chips",
            concepts: ["administrator", "editor", "observer", "creator"],
            priority: "medium",
          },
        ],
      },
      {
        name: "Coin usage",
        pages: [page.manage],
        usages: [
          { element: "Burn rate", concepts: "burnRate", was: "TrendingUp" },
          { element: "Storage", concepts: "storage", was: "Storage" },
          { element: "Predicted spend", concepts: "predictedSpend", priority: "medium" },
          { element: "Instance spend", concepts: "processing", priority: "medium" },
          { element: "Coin usage heading", concepts: "coins", priority: "medium" },
        ],
      },
      {
        name: "What you can do here",
        pages: [page.manage],
        usages: [
          { element: "Available", concepts: "available", priority: "medium" },
          { element: "Unavailable", concepts: "unavailable", priority: "medium" },
          { element: "Change files / Run work", concepts: ["files", "run"], priority: "medium" },
        ],
      },
      {
        name: "People and privacy",
        pages: [page.manage],
        usages: [
          { element: "Remove person", concepts: "close", was: "Cancel" },
          {
            element: "Role section headings",
            concepts: ["administrator", "editor", "observer"],
            priority: "medium",
          },
        ],
      },
      {
        name: "Danger zone and identifiers",
        pages: [page.manage],
        usages: [
          { element: "Copy identifier", concepts: "copy", was: "ContentCopy" },
          { element: "Delete project", concepts: "delete", priority: "high" },
          { element: "Delete project confirmation (submit)", concepts: "delete" },
        ],
      },
    ],
  },
  {
    title: "Datasets",
    functions: [
      {
        name: "Dataset table",
        pages: [page.datasets],
        usages: [
          { element: "Search", concepts: "search", was: "SearchRounded" },
          { element: "Expand", concepts: "expand", was: "ExpandMore" },
          { element: "Collapse", concepts: "collapse", was: "ExpandLess" },
          { element: "Row selection", concepts: "checkboxChecked", was: "CheckBox" },
          {
            element: "Partial selection",
            concepts: "checkboxPartial",
            was: "IndeterminateCheckBox",
          },
          {
            element: "File type per dataset / version",
            concepts: ["molecule", "tableFile", "textFile", "file"],
            priority: "high",
          },
          {
            element: "Dataset row / version row",
            concepts: ["dataset", "newVersion"],
            priority: "medium",
          },
        ],
      },
      {
        name: "Upload datasets",
        pages: [page.datasets],
        usages: [
          { element: "Upload dataset", concepts: "uploadDataset", was: "CloudUploadRounded" },
          { element: "File uploaded", concepts: "check", was: "DoneRounded" },
          { element: "Remove file", concepts: "delete", was: "DeleteRounded" },
          { element: "Retry failed upload", concepts: "retry", priority: "medium" },
          { element: "Upload dialog (submit)", concepts: "uploadDataset" },
        ],
      },
      {
        name: "Filter datasets",
        pages: [page.datasets],
        usages: [{ element: "Add label filter", concepts: "add", was: "AddCircle" }],
      },
      {
        name: "Bulk delete",
        pages: [page.datasets],
        usages: [{ element: "Delete selected", concepts: "delete", was: "DeleteForever" }],
      },
      {
        name: "Dataset actions and editors",
        pages: [page.datasetDetail],
        usages: [
          { element: "Create a new version", concepts: "newVersion", was: "BackupRounded" },
          { element: "Add a label", concepts: "add", was: "AddCircleOutlineRounded" },
          { element: "Remove label / editor", concepts: "close", was: "Cancel" },
          { element: "New version dialog (submit)", concepts: "newVersion" },
        ],
      },
      {
        name: "Version viewing",
        pages: [page.datasetDetail],
        usages: [
          { element: "Plaintext viewer", concepts: "textViewer", was: "Description" },
          { element: "Browser viewer", concepts: "browserViewer", was: "Description" },
        ],
      },
      {
        name: "Version actions",
        pages: [page.datasetDetail],
        usages: [
          { element: "Attach to a project", concepts: "attach", was: "AttachFileRounded" },
          { element: "View and edit schema", concepts: "schema", was: "FindInPageRounded" },
          { element: "Delete version", concepts: "delete", was: "DeleteForever" },
          { element: "Reset schema field", concepts: "restore", was: "Restore" },
          { element: "Attach dialog (submit)", concepts: "attach" },
          { element: "Schema dialog: Save (submit)", concepts: "save" },
        ],
      },
      {
        name: "Dataset version viewer",
        pages: [page.datasetView],
        usages: [{ element: "Back to dataset version", concepts: "back", was: "ArrowBack" }],
      },
    ],
  },
  {
    title: "Administration",
    functions: [
      {
        name: "Administration rail",
        pages: [page.adminRail],
        usages: [
          { element: "Overview", concepts: "organisation", was: "BusinessRounded" },
          { element: "Charges", concepts: "charges", was: "PaymentsOutlined" },
          { element: "Usage & Inventory", concepts: "usage", was: "QueryStatsOutlined" },
          { element: "Search units", concepts: "search", was: "SearchRounded" },
          { element: "Personal unit", concepts: "personalUnit", was: "PersonRounded" },
          { element: "Shared unit", concepts: "unit", was: "FolderSharedRounded" },
          { element: "Private unit", concepts: "private", was: "LockOutlined" },
          { element: "Public unit", concepts: "public", was: "PublicOutlined" },
        ],
      },
      {
        name: "Organisation overview",
        pages: [page.adminOverview],
        usages: [
          { element: "Remove member", concepts: "close", was: "Cancel" },
          { element: "Create unit", concepts: "unit", priority: "medium" },
          { element: "Create personal unit", concepts: "personalUnit", priority: "medium" },
          { element: "Create organisation", concepts: "organisation", priority: "medium" },
          { element: "Create unit / organisation dialog (submit)", concepts: "add" },
        ],
      },
      {
        name: "Unit workspace tabs",
        pages: [page.adminUnit],
        usages: [
          { element: "Access tab", concepts: "access", priority: "high" },
          { element: "Subscriptions tab", concepts: "subscription", priority: "high" },
          { element: "Charges tab", concepts: "charges", priority: "high" },
          { element: "Usage & Inventory tab", concepts: "usage", priority: "high" },
        ],
      },
      {
        name: "Unit access",
        pages: [page.adminUnit],
        usages: [
          { element: "Delete unit", concepts: "delete", was: "DeleteForever" },
          { element: "Remove member", concepts: "close", was: "Cancel" },
        ],
      },
      {
        name: "Subscriptions",
        pages: [page.adminSubs],
        usages: [
          { element: "Delete subscription", concepts: "delete", was: "DeleteForever" },
          { element: "Kind: project subscription", concepts: "project", priority: "medium" },
          { element: "Kind: dataset storage", concepts: "storage", priority: "medium" },
          { element: "Claiming project", concepts: "project", priority: "medium" },
          { element: "Create linked project", concepts: "add" },
          { element: "Create dataset storage subscription dialog (submit)", concepts: "add" },
        ],
      },
      {
        name: "Charges",
        pages: [page.adminCharges],
        usages: [
          { element: "Processing charges section", concepts: "processing", priority: "medium" },
          { element: "Storage charges section", concepts: "storage", priority: "medium" },
        ],
      },
      {
        name: "Usage & Inventory",
        pages: [page.adminUsage],
        usages: [
          { element: "Is a unit member", concepts: "check", was: "Done" },
          { element: "Is not a unit member", concepts: "close", was: "Close" },
          { element: "Pivot: By project", concepts: "project", priority: "medium" },
          { element: "Pivot: By user", concepts: "person", priority: "medium" },
        ],
      },
    ],
  },
  {
    title: "Shared components (drawn by MUI and form libraries)",
    functions: [
      {
        name: "Alerts",
        pages: [page.everyAlert],
        usages: [
          { element: "success", concepts: "success", was: "SuccessOutlined" },
          { element: "info", concepts: "info", was: "InfoOutlined" },
          { element: "warning", concepts: "warning", was: "ReportProblemOutlined" },
          { element: "error", concepts: "error", was: "ErrorOutline" },
          { element: "Retry button inside alerts", concepts: "retry", priority: "medium" },
        ],
      },
      {
        name: "Form controls",
        pages: [page.everyForm],
        usages: [
          { element: "Select / Autocomplete popup", concepts: "dropdown", was: "ArrowDropDown" },
          { element: "Autocomplete clear", concepts: "close", was: "Close" },
          { element: "Chip delete", concepts: "close", was: "Cancel" },
          { element: "Checkbox", concepts: "checkbox", was: "CheckBoxOutlineBlank" },
          { element: "Checkbox checked", concepts: "checkboxChecked", was: "CheckBox" },
          {
            element: "Checkbox partial",
            concepts: "checkboxPartial",
            was: "IndeterminateCheckBox",
          },
          { element: "Radio", concepts: "radio", was: "RadioButtonUnchecked" },
          { element: "Radio selected", concepts: "radioChecked", was: "RadioButtonChecked" },
          { element: "Table sort", concepts: "sort", was: "ArrowDownward" },
        ],
      },
      {
        name: "Run option forms (@rjsf/mui)",
        pages: [page.runDialog, `${page.datasets} (upload options)`],
        usages: [
          { element: "Add array item", concepts: "add", was: "Add" },
          { element: "Remove array item", concepts: "delete", was: "Remove" },
          { element: "Move up", concepts: "moveUp", was: "ArrowUpward" },
          { element: "Move down", concepts: "moveDown", was: "ArrowDownward" },
          { element: "Copy array item", concepts: "copy", was: "ContentCopy" },
          { element: "Clear field", concepts: "clear", was: "Clear" },
          { element: "Error list", concepts: "error", was: "Error" },
        ],
      },
      {
        name: "Dialogs",
        pages: [page.everyDialog],
        usages: [
          { element: "Close", concepts: "close", was: "CloseRounded" },
          { element: "Delete confirmation title", concepts: "warning", priority: "medium" },
        ],
      },
    ],
  },
];

/** Rules every icon follows. Settled questions move here from `openQuestions`. */
export const designRules: { title: string; body: string }[] = [
  {
    title: "Outline only",
    body: "Glyphs are Lucide outlines; there are no filled variants. States are told apart by shape (dashed, spinning, check, cross, stop), never by fill alone. The one exception is Favourite, whose star is filled when on.",
  },
  {
    title: "2px stroke at every size",
    body: "The stroke stays 2px however large or small the icon is drawn (Lucide's absolute stroke width), so a 16px icon is as legible as a 24px one.",
  },
  {
    title: "One molecule glyph",
    body: "Every chemistry format (SDF, MOL, SMILES, PDB) and the molecules input type use the one custom Molecule glyph. Revisit if formats need telling apart.",
  },
  {
    title: "Every primary action has an icon",
    body: "A primary action is a filled (contained) button or a dialog's submit button. Each carries the icon of the concept it performs, placed before its label.",
  },
];

/** Decisions still to make. Move a question to `designRules`, or mark its concepts `decided`, once settled. */
export const openQuestions: { title: string; body: string }[] = [];

/** Glyphs Lucide does not have, drawn on its grid: 24px, 2px stroke, round caps and joins. */
export const customGlyphs: Record<string, string> = {
  molecule:
    '<path d="M10 7l5.2 3v6L10 19l-5.2-3v-6z"/><path d="M15.2 10l3.25-1.9"/><circle cx="20" cy="7.2" r="1.8"/>',
};
