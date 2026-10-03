import { SvgIcon, type SvgIconProps } from "@mui/material";
import {
  Activity,
  AppWindow,
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ban,
  BookOpen,
  ChartColumn,
  ChartLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleMinus,
  CircleQuestionMark,
  CircleStop,
  CircleUser,
  CircleX,
  Clock,
  CloudUpload,
  Cog,
  Coins,
  Container,
  Copy,
  Cpu,
  createLucideIcon,
  CreditCard,
  Database,
  DatabasePlus,
  Download,
  Eraser,
  ExternalLink,
  Eye,
  File,
  FileArchive,
  FileBraces,
  FileImage,
  FilePlus2,
  FileSpreadsheet,
  FileSymlink,
  FileText,
  FileUp,
  Folder,
  FolderKanban,
  FolderPlus,
  Globe,
  HardDrive,
  Heading,
  Hourglass,
  House,
  Info,
  KeyRound,
  Landmark,
  LetterText,
  ListChecks,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  type LucideIcon,
  Monitor,
  Moon,
  Notebook,
  Paperclip,
  Pencil,
  PencilLine,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Repeat,
  RotateCw,
  Save,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  SquareCheck,
  SquareFunction,
  SquareMinus,
  SquareTerminal,
  Star,
  Sun,
  SunMoon,
  TableProperties,
  Tag,
  TextCursorInput,
  Timer,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Undo2,
  Unlink,
  User,
  UserPen,
  Workflow,
  Wrench,
  X,
} from "lucide-react";

import { type ConceptKey, moleculeNode, strokeWidth } from "./iconConcepts";

/** A ring with a substituent, for chemistry: Lucide has no molecule glyph. */
export const Molecule = createLucideIcon("molecule", moleculeNode);

/**
 * The glyph each concept is drawn with, as named in `iconConcepts.ts`; a contract test holds the two
 * together. Concepts the design draws without an icon are absent.
 */
export const conceptGlyphs = {
  // Places and resources
  home: House,
  documentation: BookOpen,
  organisation: Landmark,
  administration: Settings,
  unit: Container,
  personalUnit: User,
  person: User,
  project: FolderKanban,
  dataset: Database,
  subscription: CreditCard,
  access: KeyRound,
  charges: Receipt,
  processing: Cpu,
  storage: HardDrive,
  coins: Coins,
  usage: ChartColumn,
  burnRate: TrendingUp,
  predictedSpend: ChartLine,
  account: CircleUser,
  eventStream: Activity,

  // Project sections
  files: Folder,
  run: Play,
  results: ListChecks,
  manage: Wrench,

  // Definitions and results
  workflow: Workflow,
  application: AppWindow,
  job: SquareFunction,
  task: Cog,
  exitCode: SquareTerminal,
  logs: ScrollText,
  time: Clock,
  duration: Timer,

  // Status
  queued: CircleDashed,
  running: LoaderCircle,
  deleting: CircleMinus,
  succeeded: CircleCheck,
  failed: CircleX,
  stopped: CircleStop,
  unknown: CircleQuestionMark,
  available: Check,
  unavailable: Ban,

  // Severity (alerts)
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,

  // Roles and privacy
  administrator: ShieldCheck,
  editor: UserPen,
  observer: Eye,
  creator: Sparkles,
  evaluation: Hourglass,
  private: Lock,
  public: Globe,

  // Files and their kinds
  directory: Folder,
  managedFile: FileSymlink,
  unmanagedFile: File,
  file: File,
  textFile: FileText,
  tableFile: FileSpreadsheet,
  structuredFile: FileBraces,
  archiveFile: FileArchive,
  imageFile: FileImage,
  notebookFile: Notebook,
  molecule: Molecule,
  value: TextCursorInput,
  markdownViewer: Heading,
  textViewer: LetterText,
  browserViewer: Monitor,
  schema: TableProperties,
  label: Tag,

  // Actions
  add: Plus,
  createDirectory: FolderPlus,
  uploadFile: FileUp,
  uploadDataset: CloudUpload,
  newVersion: FilePlus2,
  createDataset: DatabasePlus,
  attach: Paperclip,
  detach: Unlink,
  delete: Trash2,
  rename: PencilLine,
  edit: Pencil,
  save: Save,
  clear: Eraser,
  restore: Undo2,
  download: Download,
  copy: Copy,
  refresh: RefreshCw,
  retry: RotateCw,
  rerun: Repeat,
  stop: Square,
  archive: Archive,
  unarchive: ArchiveRestore,
  favourite: Star,
  search: Search,
  externalLink: ExternalLink,
  signIn: LogIn,
  signOut: LogOut,
  moveUp: ArrowUp,
  moveDown: ArrowDown,

  // Navigation and controls
  back: ArrowLeft,
  contains: ArrowRight,
  previous: ChevronLeft,
  next: ChevronRight,
  expand: ChevronDown,
  collapse: ChevronUp,
  dropdown: ChevronDown,
  close: X,
  check: Check,
  sort: ArrowDown,
  checkbox: Square,
  checkboxChecked: SquareCheck,
  checkboxPartial: SquareMinus,
  radio: Circle,
  radioChecked: CircleDot,

  // Colour schemes
  lightMode: Sun,
  systemMode: SunMoon,
  darkMode: Moon,
} as const satisfies Partial<Record<ConceptKey, LucideIcon>>;

/**
 * A concept's icon, as a Material UI `SvgIcon`: `fontSize`, `color`, `sx` and `titleAccess` behave as
 * they do for any Material icon, and the icon sizes with the text around it.
 *
 * Lucide draws with a stroke, so the fill `SvgIcon` applies is switched off. The stroke does not scale:
 * it is the design's `strokeWidth` in screen pixels at every size.
 */
const conceptIcon = (concept: keyof typeof conceptGlyphs) => {
  const Icon = ({ sx, ...props }: SvgIconProps) => (
    <SvgIcon
      inheritViewBox
      component={conceptGlyphs[concept]}
      sx={[
        { fill: "none", strokeWidth, "& *": { vectorEffect: "non-scaling-stroke" } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
  Icon.displayName = `${concept}Icon`;
  // Material UI recognises its own icons by this marker, e.g. to size an adornment.
  Icon.muiName = SvgIcon.muiName;
  return Icon;
};

// Places and resources
export const HomeIcon = conceptIcon("home");
export const DocumentationIcon = conceptIcon("documentation");
export const OrganisationIcon = conceptIcon("organisation");
export const AdministrationIcon = conceptIcon("administration");
export const UnitIcon = conceptIcon("unit");
export const PersonalUnitIcon = conceptIcon("personalUnit");
export const PersonIcon = conceptIcon("person");
export const ProjectIcon = conceptIcon("project");
export const DatasetIcon = conceptIcon("dataset");
export const SubscriptionIcon = conceptIcon("subscription");
export const AccessIcon = conceptIcon("access");
export const ChargesIcon = conceptIcon("charges");
export const ProcessingIcon = conceptIcon("processing");
export const StorageIcon = conceptIcon("storage");
export const CoinsIcon = conceptIcon("coins");
export const UsageIcon = conceptIcon("usage");
export const BurnRateIcon = conceptIcon("burnRate");
export const PredictedSpendIcon = conceptIcon("predictedSpend");
export const AccountIcon = conceptIcon("account");
export const EventStreamIcon = conceptIcon("eventStream");

// Project sections
export const FilesIcon = conceptIcon("files");
export const RunIcon = conceptIcon("run");
export const ResultsIcon = conceptIcon("results");
export const ManageIcon = conceptIcon("manage");

// Definitions and results
export const WorkflowIcon = conceptIcon("workflow");
export const ApplicationIcon = conceptIcon("application");
export const JobIcon = conceptIcon("job");
export const TaskIcon = conceptIcon("task");
export const ExitCodeIcon = conceptIcon("exitCode");
export const LogsIcon = conceptIcon("logs");
export const TimeIcon = conceptIcon("time");
export const DurationIcon = conceptIcon("duration");

// Status
export const QueuedIcon = conceptIcon("queued");
export const RunningIcon = conceptIcon("running");
export const DeletingIcon = conceptIcon("deleting");
export const SucceededIcon = conceptIcon("succeeded");
export const FailedIcon = conceptIcon("failed");
export const StoppedIcon = conceptIcon("stopped");
export const UnknownIcon = conceptIcon("unknown");
export const AvailableIcon = conceptIcon("available");
export const UnavailableIcon = conceptIcon("unavailable");

// Severity (alerts)
export const InfoIcon = conceptIcon("info");
export const SuccessIcon = conceptIcon("success");
export const WarningIcon = conceptIcon("warning");
export const ErrorIcon = conceptIcon("error");

// Roles and privacy
export const AdministratorIcon = conceptIcon("administrator");
export const EditorIcon = conceptIcon("editor");
export const ObserverIcon = conceptIcon("observer");
export const CreatorIcon = conceptIcon("creator");
export const EvaluationIcon = conceptIcon("evaluation");
export const PrivateIcon = conceptIcon("private");
export const PublicIcon = conceptIcon("public");

// Files and their kinds
export const DirectoryIcon = conceptIcon("directory");
export const ManagedFileIcon = conceptIcon("managedFile");
export const UnmanagedFileIcon = conceptIcon("unmanagedFile");
export const FileIcon = conceptIcon("file");
export const TextFileIcon = conceptIcon("textFile");
export const TableFileIcon = conceptIcon("tableFile");
export const StructuredFileIcon = conceptIcon("structuredFile");
export const ArchiveFileIcon = conceptIcon("archiveFile");
export const ImageFileIcon = conceptIcon("imageFile");
export const NotebookFileIcon = conceptIcon("notebookFile");
export const MoleculeIcon = conceptIcon("molecule");
export const ValueIcon = conceptIcon("value");
export const MarkdownViewerIcon = conceptIcon("markdownViewer");
export const TextViewerIcon = conceptIcon("textViewer");
export const BrowserViewerIcon = conceptIcon("browserViewer");
export const SchemaIcon = conceptIcon("schema");
export const LabelIcon = conceptIcon("label");

// Actions
export const AddIcon = conceptIcon("add");
export const CreateDirectoryIcon = conceptIcon("createDirectory");
export const UploadFileIcon = conceptIcon("uploadFile");
export const UploadDatasetIcon = conceptIcon("uploadDataset");
export const NewVersionIcon = conceptIcon("newVersion");
export const CreateDatasetIcon = conceptIcon("createDataset");
export const AttachIcon = conceptIcon("attach");
export const DetachIcon = conceptIcon("detach");
export const DeleteIcon = conceptIcon("delete");
export const RenameIcon = conceptIcon("rename");
export const EditIcon = conceptIcon("edit");
export const SaveIcon = conceptIcon("save");
export const ClearIcon = conceptIcon("clear");
export const RestoreIcon = conceptIcon("restore");
export const DownloadIcon = conceptIcon("download");
export const CopyIcon = conceptIcon("copy");
export const RefreshIcon = conceptIcon("refresh");
export const RetryIcon = conceptIcon("retry");
export const RerunIcon = conceptIcon("rerun");
export const StopIcon = conceptIcon("stop");
export const ArchiveIcon = conceptIcon("archive");
export const UnarchiveIcon = conceptIcon("unarchive");
export const FavouriteIcon = conceptIcon("favourite");
export const SearchIcon = conceptIcon("search");
export const ExternalLinkIcon = conceptIcon("externalLink");
export const SignInIcon = conceptIcon("signIn");
export const SignOutIcon = conceptIcon("signOut");
export const MoveUpIcon = conceptIcon("moveUp");
export const MoveDownIcon = conceptIcon("moveDown");

// Navigation and controls
export const BackIcon = conceptIcon("back");
export const ContainsIcon = conceptIcon("contains");
export const PreviousIcon = conceptIcon("previous");
export const NextIcon = conceptIcon("next");
export const ExpandIcon = conceptIcon("expand");
export const CollapseIcon = conceptIcon("collapse");
export const DropdownIcon = conceptIcon("dropdown");
export const CloseIcon = conceptIcon("close");
export const CheckIcon = conceptIcon("check");
export const SortIcon = conceptIcon("sort");
export const CheckboxIcon = conceptIcon("checkbox");
export const CheckboxCheckedIcon = conceptIcon("checkboxChecked");
export const CheckboxPartialIcon = conceptIcon("checkboxPartial");
export const RadioIcon = conceptIcon("radio");
export const RadioCheckedIcon = conceptIcon("radioChecked");

// Colour schemes
export const LightModeIcon = conceptIcon("lightMode");
export const SystemModeIcon = conceptIcon("systemMode");
export const DarkModeIcon = conceptIcon("darkMode");
