import { type ConceptKey, strokeWidth } from "../../src/components/iconConcepts";

/**
 * Where the application's icons appear: the second half of the design document
 * `docs/iconography/index.html`, beside the concept vocabulary in `src/components/iconConcepts.ts`.
 *
 * Edit either file, then run `pnpm docs:iconography` to regenerate the HTML. The generator fails on a
 * Lucide glyph name that does not exist, and TypeScript fails on a usage naming an unknown concept.
 *
 * - A **function** is something the application does, listed with the pages it appears on and each
 *   element that carries an icon, by concept.
 * - A **design rule** applies to every icon (`designRules`); an undecided matter is an open question.
 *
 * Adding a function: add it to its area in `areas` and give each element a concept (every primary
 * action button included). A new idea with no concept that means the same thing needs a concept in
 * `iconConcepts.ts` first.
 *
 * `was` records the Material icon an element used before the move to Lucide (issue #200). Leave it
 * off new elements.
 */

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
        usages: [
          { element: "Back to Projects", concepts: "back", priority: "medium" },
          { element: "Create project / Create linked project (submit)", concepts: "add" },
          { element: "Retry", concepts: "retry" },
        ],
      },
      {
        name: "Personal unit / unit offer",
        pages: [page.projects, page.newProject],
        usages: [
          { element: "Create personal unit", concepts: "personalUnit", priority: "medium" },
          { element: "Create unit", concepts: "unit", priority: "medium" },
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
          { element: "Create directory popover (submit)", concepts: "createDirectory" },
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
          {
            element: "Open application in a new tab",
            concepts: "externalLink",
            priority: "medium",
          },
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
            element: "Dataset row (a version row shows its file type)",
            concepts: "dataset",
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
          { element: "Add label popover (submit)", concepts: "add" },
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
          {
            element: "Section tabs: Subscription / Charges",
            concepts: ["subscription", "charges"],
          },
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
        name: "Steppers",
        pages: [`${page.projects} (first-project onboarding)`],
        usages: [
          { element: "Completed step", concepts: "succeeded", was: "CheckCircle" },
          { element: "Failed step", concepts: "error", was: "Warning" },
        ],
      },
      {
        name: "Dialogs",
        pages: [page.everyDialog],
        usages: [
          { element: "Close", concepts: "close", was: "CloseRounded" },
          {
            element: "Confirmation title (delete, detach, stop)",
            concepts: "warning",
            priority: "medium",
          },
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
    title: `${strokeWidth}px stroke at every size`,
    body: `The stroke is ${strokeWidth}px however large or small the icon is drawn, so a 16px icon is as legible as a 24px one. It is lighter than Lucide's default of 2px, which read as too heavy beside the application's text. Change it in one place: \`strokeWidth\` in this file.`,
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
