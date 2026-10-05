import { type IconNode } from "lucide-react";

/**
 * The application's icon vocabulary: every concept it draws, and the Lucide glyph each is drawn with.
 *
 * This is the design's single source of truth. `icons.tsx` draws each concept with the glyph named
 * here (a contract test holds the two together), and the design document
 * `docs/iconography/index.html` is generated from this file and `docs/iconography/iconography.ts`.
 *
 * A **concept** is one idea in the application (Project, Delete, Failed…) and has exactly one glyph.
 * Components use concepts, never glyphs, so a concept cannot be drawn two ways. Add a concept (status
 * `proposed`) only when no existing one means the same thing; change a glyph here and every place the
 * concept appears follows. After any change run `pnpm docs:iconography`.
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
    glyph: "list-checks",
    status: "decided",
    alternatives: ["clipboard-list", "history"],
    note: "Not history: that reads as the Material History icon it replaced.",
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
  markdownViewer: {
    group: FILES,
    label: "Markdown viewer",
    glyph: "heading",
    status: "proposed",
    alternatives: ["pilcrow", "book-open-text"],
    note: "A heading is the most recognisable thing Markdown formats, and unlike the text viewer's glyph it reads as rendered rather than raw.",
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

/** The stroke every icon is drawn with, in screen pixels at every size. Lucide's own default is 2. */
export const strokeWidth = 1.75;

/** Lucide has no molecule, so this one is drawn on its grid: 24px, round caps and joins. */
export const moleculeNode: IconNode = [
  ["path", { d: "M10 7l5.2 3v6L10 19l-5.2-3v-6z", key: "ring" }],
  ["path", { d: "M15.2 10l3.25-1.9", key: "bond" }],
  ["circle", { cx: "20", cy: "7.2", r: "1.8", key: "atom" }],
];
