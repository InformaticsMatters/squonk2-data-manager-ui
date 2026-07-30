/**
 * PROTOTYPE: Three responsive application shells, switchable via ?variant=.
 * All data and mutations are fake; this route exists only to settle issue 1907.
 */
import { useEffect, useState } from "react";

import {
  AccountTreeRounded,
  ArrowBackRounded,
  ArrowForwardRounded,
  BusinessRounded,
  ChevronRightRounded,
  CloudUploadRounded,
  DataObjectRounded,
  FolderRounded,
  KeyboardArrowDownRounded,
  MenuRounded,
  PersonRounded,
  ScienceRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

type AdministrationTask = "charges" | "organisation-access" | "subscriptions" | "usage-inventory";
type Primary = "administration" | "datasets" | "home" | "projects";
type ProjectSection = "files" | "manage" | "results" | "run";
type Screen = "administration" | "dataset" | "datasets" | "home" | "project" | "projects";
type VariantKey = "A" | "B" | "C" | "D";

interface Project {
  id: string;
  name: string;
  organisation: string;
  unit: string;
  updated: string;
}

interface PrototypeState {
  administrationTask: AdministrationTask;
  datasetId?: string;
  organisation: string;
  projectId?: string;
  projectSection: ProjectSection;
  screen: Screen;
}

interface ShellProps {
  children: React.ReactNode;
  onChangeOrganisation: () => void;
  onNavigate: (primary: Primary) => void;
  onProjectSection: (section: ProjectSection) => void;
  state: PrototypeState;
}

const projects: Project[] = [
  {
    id: "01K0V62F3N8YQ5M1HT7C9J4XBP",
    name: "Kinase screen",
    organisation: "Acme Research",
    unit: "Discovery",
    updated: "12 min ago",
  },
  {
    id: "01K0V65R9C2MW7X4BQ8H1T6NYF",
    name: "Kinase screen",
    organisation: "Acme Research",
    unit: "Screening",
    updated: "Yesterday",
  },
  {
    id: "01K0V68T1H7DQ3N9YP5C2M4XBG",
    name: "Assay QC",
    organisation: "Partner Labs",
    unit: "Translational",
    updated: "3 hours ago",
  },
];

const datasets = [
  { id: "DS-7R2K", name: "ChEMBL 35", records: "2.4m compounds", version: 35 },
  { id: "DS-9M4Q", name: "Enamine REAL", records: "5.5bn compounds", version: 24 },
  { id: "DS-3F8N", name: "Approved drugs", records: "4,576 compounds", version: 8 },
];

const administrationTasks: { key: AdministrationTask; label: string }[] = [
  { key: "organisation-access", label: "Organisation & access" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "charges", label: "Charges" },
  { key: "usage-inventory", label: "Usage & inventory" },
];

const projectSections: { key: ProjectSection; label: string }[] = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
];

const variantNames: Record<VariantKey, string> = {
  A: "Layered masthead",
  B: "Workspace frame",
  C: "Compact command deck",
  D: "Split identity masthead",
};

const queryValue = (value: string[] | string | undefined) =>
  typeof value === "string" ? value : undefined;

const activePrimary = (screen: Screen): Primary => {
  if (screen === "project" || screen === "projects") {
    return "projects";
  }
  if (screen === "dataset" || screen === "datasets") {
    return "datasets";
  }
  return screen;
};

const selectedProject = (state: PrototypeState) =>
  projects.find((project) => project.id === state.projectId) ?? projects[0];

const canonicalPath = (state: PrototypeState) => {
  if (state.screen === "projects") {
    return "/projects";
  }
  if (state.screen === "project") {
    return `/projects/${selectedProject(state).id}/${state.projectSection}`;
  }
  if (state.screen === "datasets") {
    return "/datasets";
  }
  if (state.screen === "dataset") {
    const dataset = datasets.find((item) => item.id === state.datasetId) ?? datasets[0];
    return `/datasets/${dataset.id}/versions/${dataset.version}`;
  }
  if (state.screen === "administration") {
    return `/administration/${state.administrationTask}`;
  }
  return "/";
};

const OrganisationMark = ({
  compact = false,
  organisation,
  onChange,
}: {
  compact?: boolean;
  organisation: string;
  onChange: () => void;
}) => (
  <Button
    color="inherit"
    endIcon={<KeyboardArrowDownRounded />}
    sx={{ minWidth: 0, px: 0.5, textTransform: "none" }}
    onClick={onChange}
  >
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
      <Avatar sx={{ bgcolor: "#d64b35", height: compact ? 30 : 38, width: compact ? 30 : 38 }}>
        <ScienceRounded fontSize="small" />
      </Avatar>
      <Box sx={{ minWidth: 0, textAlign: "left" }}>
        <Typography noWrap sx={{ fontSize: compact ? 13 : 15, fontWeight: 850, lineHeight: 1.1 }}>
          {organisation}
        </Typography>
        {!compact && (
          <Typography noWrap sx={{ fontSize: 10, letterSpacing: 1.1, opacity: 0.62 }}>
            SQUONK DATA MANAGER
          </Typography>
        )}
      </Box>
    </Stack>
  </Button>
);

const PrimaryTabs = ({
  current,
  onNavigate,
  variant = "standard",
}: {
  current: Primary;
  onNavigate: (primary: Primary) => void;
  variant?: "pills" | "standard";
}) => (
  <Stack direction="row" spacing={variant === "pills" ? 0.75 : 0} sx={{ alignItems: "center" }}>
    {(["projects", "datasets", "administration"] as Primary[]).map((primary) => (
      <Button
        color={current === primary ? "primary" : "inherit"}
        key={primary}
        sx={{
          bgcolor: variant === "pills" && current === primary ? "primary.main" : "transparent",
          borderBottom: variant === "standard" ? 3 : 0,
          borderBottomColor:
            variant === "standard" && current === primary ? "primary.main" : "transparent",
          borderRadius: variant === "pills" ? 8 : 0,
          color: variant === "pills" && current === primary ? "primary.contrastText" : undefined,
          minHeight: variant === "standard" ? 62 : 40,
          px: { xs: 1.25, sm: 2 },
          textTransform: "capitalize",
        }}
        onClick={() => onNavigate(primary)}
      >
        {primary}
      </Button>
    ))}
  </Stack>
);

const ProjectTabs = ({
  onProjectSection,
  section,
}: {
  onProjectSection: (section: ProjectSection) => void;
  section: ProjectSection;
}) => (
  <Tabs
    allowScrollButtonsMobile
    scrollButtons="auto"
    value={section}
    variant="scrollable"
    onChange={(_, value: ProjectSection) => onProjectSection(value)}
  >
    {projectSections.map((item) => (
      <Tab key={item.key} label={item.label} value={item.key} />
    ))}
  </Tabs>
);

const LayeredMasthead = ({
  children,
  onChangeOrganisation,
  onNavigate,
  onProjectSection,
  state,
}: ShellProps) => {
  const project = selectedProject(state);
  const projectOpen = state.screen === "project";

  return (
    <Box sx={{ bgcolor: "#f4f7f6", minHeight: "100vh", pb: 10 }}>
      <AppBar color="inherit" elevation={0} position="static">
        <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 1 }}>
          <OrganisationMark organisation={state.organisation} onChange={onChangeOrganisation} />
          <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
            <PrimaryTabs current={activePrimary(state.screen)} onNavigate={onNavigate} />
          </Box>
          <IconButton sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            <PersonRounded />
          </IconButton>
        </Toolbar>
        <Box sx={{ display: { sm: "none" }, overflowX: "auto", px: 1 }}>
          <PrimaryTabs current={activePrimary(state.screen)} onNavigate={onNavigate} />
        </Box>
        {!!projectOpen && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              sx={{ alignItems: { md: "center" }, maxWidth: 1180, mx: "auto", px: 2 }}
            >
              <Box sx={{ minWidth: 230, py: 1 }}>
                <Typography sx={{ fontWeight: 850 }}>{project.name}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {project.unit} · {project.organisation}
                </Typography>
              </Box>
              <Box sx={{ ml: { md: "auto" }, maxWidth: "100%" }}>
                <ProjectTabs section={state.projectSection} onProjectSection={onProjectSection} />
              </Box>
            </Stack>
          </Box>
        )}
      </AppBar>
      <ContentFrame state={state}>{children}</ContentFrame>
    </Box>
  );
};

const SplitIdentityMasthead = ({
  children,
  onChangeOrganisation,
  onNavigate,
  onProjectSection,
  state,
}: ShellProps) => {
  const project = selectedProject(state);
  const projectOpen = state.screen === "project";

  return (
    <Box sx={{ bgcolor: "#f4f7f6", minHeight: "100vh", pb: 10 }}>
      <AppBar color="inherit" elevation={0} position="static">
        <Toolbar disableGutters sx={{ borderBottom: 1, borderColor: "divider", minHeight: 64 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              alignSelf: "stretch",
              bgcolor: "#20262b",
              color: "white",
              minWidth: { sm: 390 },
              px: { xs: 1.5, sm: 2.5 },
            }}
          >
            <Button color="inherit" sx={{ minWidth: 0, p: 0 }} onClick={() => onNavigate("home")}>
              <ScienceRounded />
              <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 900, ml: 1 }}>
                SQUONK
              </Typography>
            </Button>
            <Divider
              flexItem
              orientation="vertical"
              sx={{ borderColor: "rgba(255,255,255,.18)", mx: 2 }}
            />
            <OrganisationMark
              compact
              organisation={state.organisation}
              onChange={onChangeOrganisation}
            />
          </Stack>
          <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
            <PrimaryTabs current={activePrimary(state.screen)} onNavigate={onNavigate} />
          </Box>
          <IconButton sx={{ display: { xs: "none", sm: "inline-flex" }, mr: 2 }}>
            <PersonRounded />
          </IconButton>
        </Toolbar>
        <Box sx={{ display: { sm: "none" }, overflowX: "auto", px: 1 }}>
          <PrimaryTabs current={activePrimary(state.screen)} onNavigate={onNavigate} />
        </Box>
        {!!projectOpen && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              sx={{ alignItems: { md: "center" }, maxWidth: 1180, mx: "auto", px: 2 }}
            >
              <Box sx={{ minWidth: 230, py: 1 }}>
                <Typography sx={{ fontWeight: 850 }}>{project.name}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {project.unit} · {project.organisation}
                </Typography>
              </Box>
              <Box sx={{ ml: { md: "auto" }, maxWidth: "100%" }}>
                <ProjectTabs section={state.projectSection} onProjectSection={onProjectSection} />
              </Box>
            </Stack>
          </Box>
        )}
      </AppBar>
      <ContentFrame state={state}>{children}</ContentFrame>
    </Box>
  );
};

const WorkspaceFrame = ({
  children,
  onChangeOrganisation,
  onNavigate,
  onProjectSection,
  state,
}: ShellProps) => {
  const project = selectedProject(state);
  const projectOpen = state.screen === "project";

  return (
    <Box sx={{ bgcolor: "#f1efe9", minHeight: "100vh", pb: { xs: 18, sm: 10 } }}>
      <Box sx={{ bgcolor: "#173c3a", color: "white" }}>
        <Toolbar sx={{ maxWidth: 1260, mx: "auto", width: "100%" }}>
          <IconButton color="inherit" onClick={() => onNavigate("home")}>
            <ScienceRounded />
          </IconButton>
          <Typography sx={{ fontWeight: 900, letterSpacing: 0.4, ml: 1 }}>SQUONK</Typography>
          <Box sx={{ ml: "auto" }}>
            <OrganisationMark
              compact
              organisation={state.organisation}
              onChange={onChangeOrganisation}
            />
          </Box>
          <IconButton color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            <PersonRounded />
          </IconButton>
        </Toolbar>
      </Box>
      <Paper
        square
        elevation={0}
        sx={{ bgcolor: "#dce8df", borderBottom: 1, borderColor: "#bdd0c2", py: 1.25 }}
      >
        <Stack direction="row" sx={{ justifyContent: "center" }}>
          <PrimaryTabs
            current={activePrimary(state.screen)}
            variant="pills"
            onNavigate={onNavigate}
          />
        </Stack>
      </Paper>
      {!!projectOpen && (
        <Paper
          elevation={0}
          sx={{ borderRadius: 0, borderBottom: 1, borderColor: "divider", bgcolor: "white" }}
        >
          <Stack sx={{ maxWidth: 1180, mx: "auto", px: 2, pt: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
              <FolderRounded color="primary" />
              <Typography sx={{ fontWeight: 850 }}>{project.name}</Typography>
              <Chip label={`${project.unit} · ${project.organisation}`} size="small" />
            </Stack>
            <ProjectTabs section={state.projectSection} onProjectSection={onProjectSection} />
          </Stack>
        </Paper>
      )}
      <ContentFrame state={state}>{children}</ContentFrame>
    </Box>
  );
};

const CompactCommandDeck = ({
  children,
  onChangeOrganisation,
  onNavigate,
  onProjectSection,
  state,
}: ShellProps) => {
  const project = selectedProject(state);
  const projectOpen = state.screen === "project";

  return (
    <Box sx={{ bgcolor: "#f7f7f4", minHeight: "100vh", pb: { xs: 16, sm: 10 } }}>
      <AppBar elevation={0} position="static" sx={{ bgcolor: "#20262b" }}>
        <Toolbar sx={{ gap: 1, maxWidth: 1240, mx: "auto", width: "100%" }}>
          <IconButton color="inherit" sx={{ display: { sm: "none" } }}>
            <MenuRounded />
          </IconButton>
          <Button color="inherit" sx={{ p: 0 }} onClick={() => onNavigate("home")}>
            <ScienceRounded />
            <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 900, ml: 1 }}>
              SQUONK
            </Typography>
          </Button>
          <Divider
            flexItem
            orientation="vertical"
            sx={{ borderColor: "rgba(255,255,255,.18)", mx: 1 }}
          />
          <OrganisationMark
            compact
            organisation={state.organisation}
            onChange={onChangeOrganisation}
          />
          <Box sx={{ display: { xs: "none", sm: "block" }, ml: "auto" }}>
            <PrimaryTabs current={activePrimary(state.screen)} onNavigate={onNavigate} />
          </Box>
          <IconButton color="inherit">
            <PersonRounded />
          </IconButton>
        </Toolbar>
      </AppBar>
      {!!projectOpen && (
        <Box sx={{ bgcolor: "#e9ece8", borderBottom: 1, borderColor: "divider" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            sx={{ alignItems: { md: "center" }, maxWidth: 1180, mx: "auto", px: 2 }}
          >
            <Stack direction="row" sx={{ alignItems: "center", minWidth: 250, py: 1 }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                PROJECT /
              </Typography>
              <Typography sx={{ fontWeight: 850, ml: 1 }}>{project.name}</Typography>
            </Stack>
            <Box sx={{ ml: { md: "auto" }, maxWidth: "100%" }}>
              <ProjectTabs section={state.projectSection} onProjectSection={onProjectSection} />
            </Box>
          </Stack>
        </Box>
      )}
      <ContentFrame state={state}>{children}</ContentFrame>
      <Paper
        elevation={10}
        sx={{
          bottom: 0,
          display: { sm: "none" },
          left: 0,
          position: "fixed",
          right: 0,
          zIndex: 1100,
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "space-around" }}>
          {(["projects", "datasets", "administration"] as Primary[]).map((primary) => (
            <Button
              color={activePrimary(state.screen) === primary ? "primary" : "inherit"}
              key={primary}
              sx={{ flex: 1, fontSize: 11, minHeight: 58, textTransform: "capitalize" }}
              onClick={() => onNavigate(primary)}
            >
              {primary}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

const ContentFrame = ({
  children,
  state,
}: {
  children: React.ReactNode;
  state: PrototypeState;
}) => (
  <Box sx={{ maxWidth: 1180, mx: "auto", p: { xs: 2, md: 4 } }}>
    <Box
      sx={{
        bgcolor: "#15242a",
        borderRadius: 1,
        color: "#bfe6de",
        fontFamily: "monospace",
        fontSize: 11,
        mb: 3,
        overflow: "hidden",
        px: 1.5,
        py: 0.75,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      URL owns displayed scope: {canonicalPath(state)}
    </Box>
    {children}
  </Box>
);

const HomeContent = ({ onOpenProject }: { onOpenProject: (project: Project) => void }) => (
  <Stack spacing={4}>
    <Box>
      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
        Welcome back, Oliver
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 900 }} variant="h3">
        Pick up where you left off
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        {projects.map((project) => (
          <Paper key={project.id} sx={{ flex: 1, p: 2.5 }} variant="outlined">
            <Chip label={`${project.unit} project`} size="small" />
            <Typography sx={{ fontWeight: 850, mt: 2 }} variant="h6">
              {project.name}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              {project.organisation} · opened {project.updated}
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => onOpenProject(project)}>
              Continue
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
    <Divider />
    <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 850 }} variant="h5">
          Welcome to Squonk Data Manager
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Run scientific workflows in a managed, collaborative environment. Start from a project or
          attach a curated dataset when your work needs one.
        </Typography>
      </Box>
      <Paper sx={{ flex: 1, p: 3 }} variant="outlined">
        <Typography sx={{ fontWeight: 850 }} variant="h6">
          Documentation
        </Typography>
        <Button endIcon={<ChevronRightRounded />} sx={{ mt: 1 }}>
          Browse guides and concepts
        </Button>
      </Paper>
    </Stack>
  </Stack>
);

const ProjectsContent = ({ onOpenProject }: { onOpenProject: (project: Project) => void }) => (
  <Box>
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "end" }, mb: 3 }}>
      <Box>
        <Typography component="h1" sx={{ fontWeight: 900 }} variant="h4">
          Projects
        </Typography>
        <Typography color="text.secondary">
          Choose a project before any project data is shown.
        </Typography>
      </Box>
      <Button sx={{ ml: { sm: "auto" }, mt: { xs: 2, sm: 0 } }} variant="contained">
        Create project
      </Button>
    </Stack>
    <TextField
      fullWidth
      placeholder="Search projects"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded />
            </InputAdornment>
          ),
        },
      }}
      sx={{ mb: 2 }}
    />
    <Stack spacing={1}>
      {projects.map((project) => (
        <Paper key={project.id} variant="outlined">
          <ListItemButton onClick={() => onOpenProject(project)}>
            <ListItemIcon>
              <FolderRounded color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={project.name}
              secondary={`${project.unit} · ${project.organisation} · ${project.updated}`}
            />
            <ChevronRightRounded />
          </ListItemButton>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const ProjectContent = ({ state }: { state: PrototypeState }) => {
  const project = selectedProject(state);
  const section = projectSections.find((item) => item.key === state.projectSection)?.label;
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 750 }}>
          {project.organisation} / {project.unit} / PROJECT
        </Typography>
        <Typography component="h1" sx={{ fontWeight: 900 }} variant="h4">
          {project.name}: {section}
        </Typography>
      </Box>
      <Paper sx={{ overflow: "hidden" }} variant="outlined">
        {["inputs", "analysis.ipynb", "screening.py", "reports"].map((name, index) => (
          <Stack
            direction="row"
            key={name}
            sx={{
              alignItems: "center",
              borderBottom: index === 3 ? 0 : 1,
              borderColor: "divider",
              gap: 2,
              px: 2,
              py: 1.5,
            }}
          >
            <FolderRounded color={index === 0 || index === 3 ? "primary" : "disabled"} />
            <Typography sx={{ fontWeight: 650 }}>{name}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 12, ml: "auto" }}>
              {index === 0 || index === 3 ? "Folder" : "Intermediate research file"}
            </Typography>
          </Stack>
        ))}
      </Paper>
      <Alert severity="info">
        Project identity stays visible while Files, Run, Results, and Manage change beneath it.
      </Alert>
    </Stack>
  );
};

const DatasetsContent = ({
  onOpenDataset,
  onUpload,
}: {
  onOpenDataset: (id: string) => void;
  onUpload: () => void;
}) => (
  <Box>
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "end" }, mb: 3 }}>
      <Box>
        <Typography component="h1" sx={{ fontWeight: 900 }} variant="h4">
          Datasets
        </Typography>
        <Typography color="text.secondary">
          Every dataset available to you, independent of unit billing context.
        </Typography>
      </Box>
      <Button
        startIcon={<CloudUploadRounded />}
        sx={{ ml: { sm: "auto" }, mt: { xs: 2, sm: 0 } }}
        variant="contained"
        onClick={onUpload}
      >
        Upload dataset
      </Button>
    </Stack>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      {datasets.map((dataset) => (
        <Paper key={dataset.id} sx={{ flex: 1, p: 2.5 }} variant="outlined">
          <DataObjectRounded color="primary" />
          <Typography sx={{ fontWeight: 850, mt: 2 }} variant="h6">
            {dataset.name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Version {dataset.version} · {dataset.records}
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => onOpenDataset(dataset.id)}>
            View dataset
          </Button>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const AdministrationContent = ({
  onTask,
  task,
}: {
  onTask: (task: AdministrationTask) => void;
  task: AdministrationTask;
}) => (
  <Box>
    <Typography component="h1" sx={{ fontWeight: 900 }} variant="h4">
      Administration
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      Tasks remain visible to every authenticated user; concrete resource capability governs
      actions.
    </Typography>
    <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
      <Paper sx={{ display: { xs: "none", md: "block" }, minWidth: 245, p: 1 }} variant="outlined">
        <List>
          {administrationTasks.map((item) => (
            <ListItemButton
              key={item.key}
              selected={task === item.key}
              onClick={() => onTask(item.key)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
      <FormControl sx={{ display: { md: "none" } }}>
        <Select value={task} onChange={(event) => onTask(event.target.value)}>
          {administrationTasks.map((item) => (
            <MenuItem key={item.key} value={item.key}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Paper sx={{ flex: 1, overflow: "hidden" }} variant="outlined">
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 850 }} variant="h6">
            {administrationTasks.find((item) => item.key === task)?.label}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Accessible resources across organisations and units; shell organisation is a highlight,
            not a hidden filter.
          </Typography>
        </Box>
        <Divider />
        {["Acme Research", "Discovery", "Screening"].map((resource, index) => (
          <ListItemButton key={resource}>
            <ListItemIcon>
              {index === 0 ? <BusinessRounded /> : <AccountTreeRounded />}
            </ListItemIcon>
            <ListItemText
              primary={resource}
              secondary={index === 0 ? "Organisation" : "Unit · Acme Research"}
            />
            <ChevronRightRounded />
          </ListItemButton>
        ))}
      </Paper>
    </Stack>
  </Box>
);

const DatasetDetail = ({
  datasetId,
  onAttach,
  onClose,
}: {
  datasetId?: string;
  onAttach: () => void;
  onClose: () => void;
}) => {
  const dataset = datasets.find((item) => item.id === datasetId) ?? datasets[0];
  return (
    <Drawer
      open
      anchor="right"
      slotProps={{ paper: { sx: { maxWidth: "100%", p: 3, width: 560 } } }}
      onClose={onClose}
    >
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 750 }}>
        DATASET
      </Typography>
      <Typography sx={{ fontWeight: 900 }} variant="h4">
        {dataset.name}
      </Typography>
      <Typography color="text.secondary">
        Version {dataset.version} · {dataset.records}
      </Typography>
      <Divider sx={{ my: 3 }} />
      <Typography sx={{ fontWeight: 800 }}>Curated molecular data</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Version identity lives in the URL. Closing returns to the dataset list without leaving stale
        selected context behind.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
        <Button variant="contained" onClick={onAttach}>
          Attach to project
        </Button>
        <Button onClick={onClose}>Close</Button>
      </Stack>
    </Drawer>
  );
};

const PrototypeSwitcher = ({ current }: { current: VariantKey }) => {
  const router = useRouter();
  const keys: VariantKey[] = ["A", "B", "C", "D"];
  const move = (offset: number) => {
    const next = keys[(keys.indexOf(current) + offset + keys.length) % keys.length];
    void router.replace(
      { pathname: router.pathname, query: { ...router.query, variant: next } },
      undefined,
      { shallow: true },
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, [contenteditable=true]")) {
        return;
      }
      if (event.key === "ArrowLeft") {
        move(-1);
      }
      if (event.key === "ArrowRight") {
        move(1);
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  });

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Paper
      elevation={14}
      sx={{
        alignItems: "center",
        bgcolor: "#101417",
        bottom: { xs: current === "C" ? 70 : 12, sm: 12 },
        color: "white",
        display: "flex",
        left: "50%",
        position: "fixed",
        px: 0.5,
        transform: "translateX(-50%)",
        zIndex: 1600,
      }}
    >
      <IconButton aria-label="Previous variant" color="inherit" onClick={() => move(-1)}>
        <ArrowBackRounded />
      </IconButton>
      <Box sx={{ minWidth: { xs: 180, sm: 245 }, px: 1, textAlign: "center" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
          {current} · {variantNames[current]}
        </Typography>
        <Typography sx={{ fontSize: 10, opacity: 0.62 }}>
          Arrow keys switch shell direction
        </Typography>
      </Box>
      <IconButton aria-label="Next variant" color="inherit" onClick={() => move(1)}>
        <ArrowForwardRounded />
      </IconButton>
    </Paper>
  );
};

const ApplicationShellPrototype = () => {
  const router = useRouter();
  const [organisationDialog, setOrganisationDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [attachmentDialog, setAttachmentDialog] = useState(false);
  const variantValue = queryValue(router.query.variant);
  const variant: VariantKey =
    variantValue === "B" || variantValue === "C" || variantValue === "D" ? variantValue : "A";
  const screenValue = queryValue(router.query.prototypeScreen);
  const validScreens: Screen[] = [
    "administration",
    "dataset",
    "datasets",
    "home",
    "project",
    "projects",
  ];
  const screen: Screen = validScreens.includes(screenValue as Screen)
    ? (screenValue as Screen)
    : "home";
  const sectionValue = queryValue(router.query.prototypeSection);
  const validSections = projectSections.map((item) => item.key);
  const projectSection: ProjectSection = validSections.includes(sectionValue as ProjectSection)
    ? (sectionValue as ProjectSection)
    : "files";
  const taskValue = queryValue(router.query.prototypeTask);
  const validTasks = administrationTasks.map((item) => item.key);
  const administrationTask: AdministrationTask = validTasks.includes(
    taskValue as AdministrationTask,
  )
    ? (taskValue as AdministrationTask)
    : "organisation-access";
  const state: PrototypeState = {
    administrationTask,
    datasetId: queryValue(router.query.prototypeDataset),
    organisation: queryValue(router.query.prototypeOrganisation) ?? "Acme Research",
    projectId: queryValue(router.query.prototypeProject),
    projectSection,
    screen,
  };

  const navigate = (patch: Partial<PrototypeState>) => {
    const next = { ...state, ...patch };
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          variant,
          prototypeScreen: next.screen,
          prototypeOrganisation: next.organisation,
          ...(next.screen === "project" && {
            prototypeProject: next.projectId,
            prototypeSection: next.projectSection,
          }),
          ...(next.screen === "dataset" && { prototypeDataset: next.datasetId }),
          ...(next.screen === "administration" && { prototypeTask: next.administrationTask }),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const onPrimary = (primary: Primary) => {
    if (primary === "home") {
      navigate({ screen: "home" });
    }
    if (primary === "projects") {
      navigate({ screen: "projects" });
    }
    if (primary === "datasets") {
      navigate({ screen: "datasets" });
    }
    if (primary === "administration") {
      navigate({ administrationTask: "organisation-access", screen: "administration" });
    }
  };

  const shellProps: Omit<ShellProps, "children"> = {
    onChangeOrganisation: () => setOrganisationDialog(true),
    onNavigate: onPrimary,
    onProjectSection: (next) => navigate({ projectSection: next, screen: "project" }),
    state,
  };

  const content = (
    <>
      {screen === "home" && (
        <HomeContent
          onOpenProject={(project) =>
            navigate({ projectId: project.id, projectSection: "files", screen: "project" })
          }
        />
      )}
      {screen === "projects" && (
        <ProjectsContent
          onOpenProject={(project) =>
            navigate({ projectId: project.id, projectSection: "files", screen: "project" })
          }
        />
      )}
      {screen === "project" && <ProjectContent state={state} />}
      {(screen === "datasets" || screen === "dataset") && (
        <DatasetsContent
          onOpenDataset={(datasetId) => navigate({ datasetId, screen: "dataset" })}
          onUpload={() => setUploadDialog(true)}
        />
      )}
      {screen === "administration" && (
        <AdministrationContent
          task={administrationTask}
          onTask={(next) => navigate({ administrationTask: next, screen: "administration" })}
        />
      )}
    </>
  );

  return (
    <>
      {variant === "A" && <LayeredMasthead {...shellProps}>{content}</LayeredMasthead>}
      {variant === "B" && <WorkspaceFrame {...shellProps}>{content}</WorkspaceFrame>}
      {variant === "C" && <CompactCommandDeck {...shellProps}>{content}</CompactCommandDeck>}
      {variant === "D" && <SplitIdentityMasthead {...shellProps}>{content}</SplitIdentityMasthead>}

      {screen === "dataset" && (
        <DatasetDetail
          datasetId={state.datasetId}
          onAttach={() => setAttachmentDialog(true)}
          onClose={() => navigate({ datasetId: undefined, screen: "datasets" })}
        />
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={organisationDialog}
        onClose={() => setOrganisationDialog(false)}
      >
        <DialogTitle>Change organisation?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Organisation is application identity. Changing it leaves the current page and returns
            home.
          </Alert>
          <List>
            {["Acme Research", "Partner Labs"].map((organisation) => (
              <ListItemButton
                key={organisation}
                selected={state.organisation === organisation}
                onClick={() => {
                  navigate({ organisation, screen: "home" });
                  setOrganisationDialog(false);
                }}
              >
                <ListItemIcon>
                  <BusinessRounded />
                </ListItemIcon>
                <ListItemText primary={organisation} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrganisationDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog fullWidth maxWidth="sm" open={uploadDialog} onClose={() => setUploadDialog(false)}>
        <DialogTitle>Upload dataset</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Unit is billing context for this upload, not dataset scope.
          </Alert>
          <TextField fullWidth label="Files" value="screening-library.sdf" />
          <TextField fullWidth select defaultValue="" label="Billing unit" sx={{ mt: 2 }}>
            <MenuItem disabled value="">
              Choose a member unit
            </MenuItem>
            <MenuItem value="discovery">Discovery · Acme Research</MenuItem>
            <MenuItem value="screening">Screening · Acme Research</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained">Start upload</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={attachmentDialog}
        onClose={() => setAttachmentDialog(false)}
      >
        <DialogTitle>Attach dataset to a project</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            No project is inferred. Choose an explicit editable target.
          </Alert>
          <TextField fullWidth select defaultValue="" label="Target project">
            <MenuItem disabled value="">
              Search or choose a project
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name} · {project.unit} · {project.organisation}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            defaultValue="/datasets/chembl"
            label="Destination path"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentDialog(false)}>Cancel</Button>
          <Button variant="contained">Attach</Button>
        </DialogActions>
      </Dialog>

      <PrototypeSwitcher current={variant} />
    </>
  );
};

export default ApplicationShellPrototype;
