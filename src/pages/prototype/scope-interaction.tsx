/**
 * PROTOTYPE: Three interaction models for explicit unit/project scope, switchable via ?variant=.
 * This route uses fake data and must not be promoted directly to production.
 */
import { useEffect, useState } from "react";

import {
  AdminPanelSettingsRounded,
  ArrowBackRounded,
  ArrowForwardRounded,
  BusinessRounded,
  ChevronRightRounded,
  CloseRounded,
  DataObjectRounded,
  FolderRounded,
  HomeRounded,
  KeyboardArrowDownRounded,
  MenuRounded,
  PersonRounded,
  ScienceRounded,
  SearchRounded,
  SwapHorizRounded,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";

type Scope = "data" | "landing" | "project";
type VariantKey = "A" | "B" | "C";

interface Project {
  id: string;
  name: string;
  unitId: string;
  updated: string;
}

interface Unit {
  id: string;
  name: string;
  detail: string;
}

const units: Unit[] = [
  { id: "discovery", name: "Discovery", detail: "18 datasets · 4 projects" },
  { id: "screening", name: "Screening", detail: "7 datasets · 3 projects" },
  { id: "informatics", name: "Informatics", detail: "11 datasets · 2 projects" },
];

const projects: Project[] = [
  { id: "kinase-screen", name: "Kinase screen", unitId: "discovery", updated: "12 min ago" },
  { id: "fragment-library", name: "Fragment library", unitId: "discovery", updated: "Yesterday" },
  { id: "assay-qc", name: "Assay QC", unitId: "screening", updated: "3 hours ago" },
  { id: "spring-release", name: "Spring release", unitId: "informatics", updated: "Monday" },
];

const variantNames: Record<VariantKey, string> = {
  A: "Choose, then enter",
  B: "Scope rail",
  C: "Recent work",
};

const projectTabs = ["Files", "Run", "Results", "Manage"];

const valueFromQuery = (value: string[] | string | undefined) =>
  typeof value === "string" ? value : undefined;

const getUnit = (id: string) => units.find((unit) => unit.id === id) ?? units[0];
const getProject = (id: string) => projects.find((project) => project.id === id) ?? projects[0];

const canonicalPath = (scope: Scope, unit: Unit, project: Project, tab: string) => {
  if (scope === "data") {
    return `/units/${unit.id}/data`;
  }
  if (scope === "project") {
    return `/units/${unit.id}/projects/${project.id}/${tab.toLowerCase()}`;
  }
  return "/home";
};

const OrganisationIdentity = ({ compact = false }: { compact?: boolean }) => (
  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
    <Avatar sx={{ bgcolor: "#db4b32", height: compact ? 30 : 36, width: compact ? 30 : 36 }}>
      <ScienceRounded fontSize="small" />
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography noWrap sx={{ fontWeight: 800, lineHeight: 1.05 }}>
        Acme Research
      </Typography>
      {!compact && (
        <Typography noWrap color="text.secondary" sx={{ fontSize: 11 }}>
          SQUONK DATA MANAGER
        </Typography>
      )}
    </Box>
  </Stack>
);

const RouteIndicator = ({ path }: { path: string }) => (
  <Box
    sx={{
      bgcolor: "#18242d",
      borderRadius: 1.5,
      color: "#c7e9e5",
      fontFamily: "monospace",
      fontSize: 12,
      overflow: "hidden",
      px: 1.5,
      py: 0.75,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }}
  >
    URL {path}
  </Box>
);

const ProjectContent = ({ project, tab, unit }: { project: Project; tab: string; unit: Unit }) => (
  <Stack spacing={2.5}>
    <Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}
      >
        {unit.name} unit · Project
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
        {project.name}
      </Typography>
    </Box>
    <Paper sx={{ overflow: "hidden" }} variant="outlined">
      {["inputs", "workflows", "reports"].map((name, index) => (
        <Stack
          direction="row"
          key={name}
          spacing={2}
          sx={{
            alignItems: "center",
            borderBottom: index === 2 ? 0 : 1,
            borderColor: "divider",
            px: 2,
            py: 1.5,
          }}
        >
          <FolderRounded color={index === 0 ? "primary" : "disabled"} />
          <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, ml: "auto !important" }}>
            {index === 0 ? "8 items" : index === 1 ? "3 items" : "2 items"}
          </Typography>
        </Stack>
      ))}
    </Paper>
    <Typography color="text.secondary">
      Showing {tab}. Choosing another project navigates to that project&apos;s own URL before this
      content changes.
    </Typography>
  </Stack>
);

const DataContent = ({ unit }: { unit: Unit }) => (
  <Stack spacing={2.5}>
    <Box>
      <Typography
        color="text.secondary"
        sx={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" }}
      >
        {unit.name} unit
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
        Data
      </Typography>
    </Box>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      {["Screening exports", "Reference compounds", "Assay archive"].map((name, index) => (
        <Paper key={name} sx={{ flex: 1, p: 2.5 }} variant="outlined">
          <DataObjectRounded color={index === 0 ? "primary" : "disabled"} />
          <Typography sx={{ fontWeight: 750, mt: 2 }}>{name}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {12 - index * 3} datasets
          </Typography>
        </Paper>
      ))}
    </Stack>
    <Typography color="text.secondary">
      Data belongs to {unit.name}. Projects are destinations for explicit dataset attachment, not an
      implicit filter on this page.
    </Typography>
  </Stack>
);

interface VariantProps {
  scope: Scope;
  unit: Unit;
  project: Project;
  tab: string;
  navigate: (next: { scope: Scope; unitId?: string; projectId?: string; tab?: string }) => void;
}

const VariantA = ({ navigate, project, scope, tab, unit }: VariantProps) => {
  const [chooser, setChooser] = useState<"project" | "unit" | null>(null);

  return (
    <Box sx={{ bgcolor: "#f4f1eb", minHeight: "100vh" }}>
      <AppBar color="transparent" elevation={0} position="static">
        <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 2 }}>
          <OrganisationIdentity />
          <Stack direction="row" spacing={0.5} sx={{ ml: "auto" }}>
            <Button color={scope === "project" ? "primary" : "inherit"}>Project</Button>
            <Button color={scope === "data" ? "primary" : "inherit"}>Data</Button>
            <Button color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
              Administration
            </Button>
            <IconButton sx={{ display: { sm: "none" } }}>
              <MenuRounded />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {scope === "landing" ? (
        <Box sx={{ maxWidth: 1050, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 8 } }}>
          <Typography color="#4b625f" sx={{ fontWeight: 700 }}>
            Welcome back, Oliver
          </Typography>
          <Typography component="h1" sx={{ fontWeight: 850, mb: 1 }} variant="h3">
            Where are you working today?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 5 }}>
            Choose the unit-owned data you need, or enter a project directly.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Paper sx={{ borderTop: "5px solid #167d74", flex: 1, p: 3 }}>
              <DataObjectRounded color="primary" fontSize="large" />
              <Typography sx={{ fontWeight: 800, mt: 2 }} variant="h5">
                Browse Data
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Select a unit before entering its datasets.
              </Typography>
              <Button endIcon={<ChevronRightRounded />} onClick={() => setChooser("unit")}>
                Choose unit
              </Button>
            </Paper>
            <Paper sx={{ borderTop: "5px solid #db4b32", flex: 1, p: 3 }}>
              <FolderRounded fontSize="large" sx={{ color: "#db4b32" }} />
              <Typography sx={{ fontWeight: 800, mt: 2 }} variant="h5">
                Open Project
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Recent: Kinase screen · Discovery
              </Typography>
              <Button endIcon={<ChevronRightRounded />} onClick={() => setChooser("project")}>
                Choose project
              </Button>
            </Paper>
          </Stack>
        </Box>
      ) : (
        <>
          <Box sx={{ bgcolor: "white", borderBottom: 1, borderColor: "divider" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{
                alignItems: { sm: "center" },
                gap: 1,
                maxWidth: 1100,
                mx: "auto",
                px: 2,
                py: 1.5,
              }}
            >
              <Button
                color="inherit"
                startIcon={<HomeRounded />}
                onClick={() => navigate({ scope: "landing" })}
              >
                Home
              </Button>
              <Button
                endIcon={<KeyboardArrowDownRounded />}
                sx={{ justifyContent: "flex-start" }}
                onClick={() => setChooser(scope === "data" ? "unit" : "project")}
              >
                {scope === "data" ? `${unit.name} data` : `${project.name} · ${unit.name}`}
              </Button>
              {scope === "project" && (
                <Tabs
                  sx={{ ml: { sm: "auto" }, minHeight: 40 }}
                  value={projectTabs.includes(tab) ? tab : "Files"}
                  variant="scrollable"
                  onChange={(_, next: string) => navigate({ scope, tab: next })}
                >
                  {projectTabs.map((item) => (
                    <Tab key={item} label={item} sx={{ minHeight: 40 }} value={item} />
                  ))}
                </Tabs>
              )}
            </Stack>
          </Box>
          <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
            <RouteIndicator path={canonicalPath(scope, unit, project, tab)} />
            <Box sx={{ mt: 3 }}>
              {scope === "data" ? (
                <DataContent unit={unit} />
              ) : (
                <ProjectContent project={project} tab={tab} unit={unit} />
              )}
            </Box>
          </Box>
        </>
      )}

      <ScopeChooser
        kind={chooser}
        onClose={() => setChooser(null)}
        onProject={(next) => {
          navigate({ scope: "project", unitId: next.unitId, projectId: next.id, tab: "Files" });
          setChooser(null);
        }}
        onUnit={(next) => {
          navigate({ scope: "data", unitId: next.id });
          setChooser(null);
        }}
      />
    </Box>
  );
};

const VariantB = ({ navigate, project, scope, tab, unit }: VariantProps) => {
  const [mobileNav, setMobileNav] = useState(false);

  const rail = (
    <Box
      sx={{ bgcolor: "#102e35", color: "white", height: "100%", width: { xs: "100%", md: 280 } }}
    >
      <Box sx={{ p: 2.5 }}>
        <OrganisationIdentity />
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,.15)" }} />
      <List sx={{ px: 1.5 }}>
        <ListItemButton
          selected={scope === "landing"}
          onClick={() => navigate({ scope: "landing" })}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
            <HomeRounded />
          </ListItemIcon>
          <ListItemText primary="Overview" />
        </ListItemButton>
        <Typography sx={{ fontSize: 11, fontWeight: 800, opacity: 0.6, pb: 0.5, pt: 2, px: 2 }}>
          DATA BY UNIT
        </Typography>
        {units.map((item) => (
          <ListItemButton
            key={item.id}
            selected={scope === "data" && unit.id === item.id}
            onClick={() => navigate({ scope: "data", unitId: item.id })}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
              <DataObjectRounded />
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItemButton>
        ))}
        <Typography sx={{ fontSize: 11, fontWeight: 800, opacity: 0.6, pb: 0.5, pt: 2, px: 2 }}>
          RECENT PROJECTS
        </Typography>
        {projects.slice(0, 3).map((item) => (
          <ListItemButton
            key={item.id}
            selected={scope === "project" && project.id === item.id}
            onClick={() =>
              navigate({ scope: "project", unitId: item.unitId, projectId: item.id, tab: "Files" })
            }
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
              <FolderRounded />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={getUnit(item.unitId).name}
              slotProps={{ secondary: { sx: { color: "#a8c1c4" } } }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Stack direction="row" sx={{ bgcolor: "#eef3f3", minHeight: "100vh" }}>
      <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>{rail}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar color="inherit" elevation={0} position="static">
          <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 1 }}>
            <IconButton sx={{ display: { md: "none" } }} onClick={() => setMobileNav(true)}>
              <MenuRounded />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap color="text.secondary" sx={{ fontSize: 11, fontWeight: 800 }}>
                {scope === "project"
                  ? `${unit.name.toUpperCase()} / PROJECT`
                  : scope === "data"
                    ? `${unit.name.toUpperCase()} / DATA`
                    : "ORGANISATION"}
              </Typography>
              <Typography noWrap sx={{ fontWeight: 800 }}>
                {scope === "project" ? project.name : scope === "data" ? "Data" : "Workspaces"}
              </Typography>
            </Box>
            <Button color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" }, ml: "auto" }}>
              Administration
            </Button>
            <IconButton>
              <PersonRounded />
            </IconButton>
          </Toolbar>
          {scope === "project" && (
            <Tabs
              value={projectTabs.includes(tab) ? tab : "Files"}
              variant="scrollable"
              onChange={(_, next: string) => navigate({ scope, tab: next })}
            >
              {projectTabs.map((item) => (
                <Tab key={item} label={item} value={item} />
              ))}
            </Tabs>
          )}
        </AppBar>
        <Box sx={{ maxWidth: 1050, mx: "auto", p: { xs: 2, md: 4 } }}>
          <RouteIndicator path={canonicalPath(scope, unit, project, tab)} />
          <Box sx={{ mt: 3 }}>
            {scope === "landing" && <RailLanding navigate={navigate} />}
            {scope === "data" && <DataContent unit={unit} />}
            {scope === "project" && <ProjectContent project={project} tab={tab} unit={unit} />}
          </Box>
        </Box>
      </Box>
      <Dialog fullScreen open={mobileNav} onClose={() => setMobileNav(false)}>
        <Box
          sx={{ bgcolor: "#102e35", color: "white", display: "flex", justifyContent: "flex-end" }}
        >
          <IconButton color="inherit" onClick={() => setMobileNav(false)}>
            <CloseRounded />
          </IconButton>
        </Box>
        <Box onClick={() => setMobileNav(false)}>{rail}</Box>
      </Dialog>
    </Stack>
  );
};

const RailLanding = ({ navigate }: Pick<VariantProps, "navigate">) => (
  <Box>
    <Typography component="h1" sx={{ fontWeight: 850 }} variant="h4">
      Workspaces
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>
      Scopes are destinations in the rail, never global filters.
    </Typography>
    <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Continue working</Typography>
    <Stack spacing={1.5}>
      {projects.slice(0, 3).map((item) => (
        <Paper key={item.id} variant="outlined">
          <ListItemButton
            onClick={() =>
              navigate({ scope: "project", unitId: item.unitId, projectId: item.id, tab: "Files" })
            }
          >
            <ListItemIcon>
              <FolderRounded color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={`${getUnit(item.unitId).name} · ${item.updated}`}
            />
            <ChevronRightRounded />
          </ListItemButton>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const VariantC = ({ navigate, project, scope, tab, unit }: VariantProps) => {
  const [switcher, setSwitcher] = useState(false);
  const title =
    scope === "project" ? project.name : scope === "data" ? `${unit.name} Data` : "Start";

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
      <AppBar elevation={0} position="static" sx={{ bgcolor: "#231f20" }}>
        <Toolbar sx={{ gap: 2 }}>
          <OrganisationIdentity compact />
          <Button
            color="inherit"
            endIcon={<KeyboardArrowDownRounded />}
            sx={{
              bgcolor: "rgba(255,255,255,.1)",
              display: { xs: "none", sm: "inline-flex" },
              ml: 2,
              textTransform: "none",
            }}
            onClick={() => setSwitcher(true)}
          >
            {title}
          </Button>
          <Stack direction="row" spacing={0.5} sx={{ ml: "auto" }}>
            {[
              ["Project", FolderRounded],
              ["Data", DataObjectRounded],
              ["Admin", AdminPanelSettingsRounded],
            ].map(([label, Icon]) => (
              <Button
                color="inherit"
                key={label as string}
                startIcon={<Icon />}
                sx={{ display: { xs: "none", md: "inline-flex" } }}
              >
                {label as string}
              </Button>
            ))}
            <IconButton
              color="inherit"
              sx={{ display: { sm: "none" } }}
              onClick={() => setSwitcher(true)}
            >
              <SwapHorizRounded />
            </IconButton>
            <IconButton color="inherit">
              <PersonRounded />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      {scope === "project" && (
        <Box sx={{ bgcolor: "white", borderBottom: 1, borderColor: "divider" }}>
          <Stack sx={{ maxWidth: 1100, mx: "auto", px: 2 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, pt: 1 }}>
              {unit.name} unit contains this project
            </Typography>
            <Tabs
              value={projectTabs.includes(tab) ? tab : "Files"}
              variant="scrollable"
              onChange={(_, next: string) => navigate({ scope, tab: next })}
            >
              {projectTabs.map((item) => (
                <Tab key={item} label={item} value={item} />
              ))}
            </Tabs>
          </Stack>
        </Box>
      )}
      <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 4 } }}>
        <RouteIndicator path={canonicalPath(scope, unit, project, tab)} />
        <Box sx={{ mt: 3 }}>
          {scope === "landing" && (
            <RecentLanding navigate={navigate} onOpen={() => setSwitcher(true)} />
          )}
          {scope === "data" && <DataContent unit={unit} />}
          {scope === "project" && <ProjectContent project={project} tab={tab} unit={unit} />}
        </Box>
      </Box>
      <CommandSwitcher
        open={switcher}
        onClose={() => setSwitcher(false)}
        onNavigate={(next) => {
          navigate(next);
          setSwitcher(false);
        }}
      />
    </Box>
  );
};

const RecentLanding = ({
  navigate,
  onOpen,
}: Pick<VariantProps, "navigate"> & { onOpen: () => void }) => (
  <Box>
    <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
      Acme Research
    </Typography>
    <Typography component="h1" sx={{ fontWeight: 850 }} variant="h3">
      Pick up where you left off
    </Typography>
    <Button startIcon={<SearchRounded />} sx={{ my: 3 }} variant="contained" onClick={onOpen}>
      Find data or a project
    </Button>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      {projects.slice(0, 3).map((item, index) => (
        <Paper
          key={item.id}
          sx={{ borderLeft: index === 0 ? "5px solid #db4b32" : undefined, flex: 1, p: 2.5 }}
          variant="outlined"
        >
          <Chip label={getUnit(item.unitId).name} size="small" />
          <Typography sx={{ fontWeight: 800, mt: 2 }} variant="h6">
            {item.name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Opened {item.updated}
          </Typography>
          <Button
            sx={{ mt: 2 }}
            onClick={() =>
              navigate({ scope: "project", unitId: item.unitId, projectId: item.id, tab: "Files" })
            }
          >
            Open project
          </Button>
        </Paper>
      ))}
    </Stack>
  </Box>
);

interface ScopeChooserProps {
  kind: "project" | "unit" | null;
  onClose: () => void;
  onProject: (project: Project) => void;
  onUnit: (unit: Unit) => void;
}

const ScopeChooser = ({ kind, onClose, onProject, onUnit }: ScopeChooserProps) => (
  <Dialog fullWidth maxWidth="sm" open={kind !== null} onClose={onClose}>
    <DialogTitle>Choose {kind === "unit" ? "a unit for Data" : "a project"}</DialogTitle>
    <DialogContent>
      <List>
        {(kind === "unit" ? units : projects).map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => (kind === "unit" ? onUnit(item as Unit) : onProject(item as Project))}
          >
            <ListItemIcon>{kind === "unit" ? <BusinessRounded /> : <FolderRounded />}</ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={
                kind === "unit"
                  ? (item as Unit).detail
                  : `${getUnit((item as Project).unitId).name} · ${(item as Project).updated}`
              }
            />
            <ChevronRightRounded />
          </ListItemButton>
        ))}
      </List>
    </DialogContent>
  </Dialog>
);

const CommandSwitcher = ({
  onClose,
  onNavigate,
  open,
}: {
  onClose: () => void;
  onNavigate: VariantProps["navigate"];
  open: boolean;
}) => {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog fullWidth fullScreen={mobile} maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ pb: 1 }}>Go to…</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search projects, units, and data"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
          }}
        />
        <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800, mt: 3 }}>
          RECENT PROJECTS
        </Typography>
        <List>
          {projects.slice(0, 3).map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() =>
                onNavigate({
                  scope: "project",
                  unitId: item.unitId,
                  projectId: item.id,
                  tab: "Files",
                })
              }
            >
              <ListItemIcon>
                <FolderRounded />
              </ListItemIcon>
              <ListItemText primary={item.name} secondary={getUnit(item.unitId).name} />
              <ChevronRightRounded />
            </ListItemButton>
          ))}
        </List>
        <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800, mt: 2 }}>
          DATA BY UNIT
        </Typography>
        <List>
          {units.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => onNavigate({ scope: "data", unitId: item.id })}
            >
              <ListItemIcon>
                <DataObjectRounded />
              </ListItemIcon>
              <ListItemText primary={`${item.name} Data`} secondary={item.detail} />
              <ChevronRightRounded />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

const PrototypeSwitcher = ({ current }: { current: VariantKey }) => {
  const router = useRouter();
  const keys: VariantKey[] = ["A", "B", "C"];
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
      elevation={12}
      sx={{
        alignItems: "center",
        bgcolor: "#171717",
        bottom: 16,
        color: "white",
        display: "flex",
        left: "50%",
        position: "fixed",
        px: 0.5,
        py: 0.5,
        transform: "translateX(-50%)",
        zIndex: 1500,
      }}
    >
      <IconButton aria-label="Previous variant" color="inherit" onClick={() => move(-1)}>
        <ArrowBackRounded />
      </IconButton>
      <Box sx={{ minWidth: { xs: 150, sm: 210 }, px: 1, textAlign: "center" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
          {current} · {variantNames[current]}
        </Typography>
        <Typography sx={{ fontSize: 10, opacity: 0.65 }}>Use ← → to compare</Typography>
      </Box>
      <IconButton aria-label="Next variant" color="inherit" onClick={() => move(1)}>
        <ArrowForwardRounded />
      </IconButton>
    </Paper>
  );
};

const ScopeInteractionPrototype = () => {
  const router = useRouter();
  const variantValue = valueFromQuery(router.query.variant);
  const variant: VariantKey = variantValue === "B" || variantValue === "C" ? variantValue : "A";
  const scopeValue = valueFromQuery(router.query.prototypeScope);
  const scope: Scope = scopeValue === "data" || scopeValue === "project" ? scopeValue : "landing";
  const project = getProject(valueFromQuery(router.query.prototypeProject) ?? "kinase-screen");
  const requestedUnit = getUnit(valueFromQuery(router.query.prototypeUnit) ?? "discovery");
  const unit = scope === "project" ? getUnit(project.unitId) : requestedUnit;
  const tab = valueFromQuery(router.query.prototypeTab) ?? "Files";

  const navigate: VariantProps["navigate"] = (next) => {
    const nextProject = next.projectId ? getProject(next.projectId) : project;
    const nextUnitId = next.scope === "project" ? nextProject.unitId : (next.unitId ?? unit.id);
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          variant,
          prototypeScope: next.scope,
          ...(next.scope !== "landing" && { prototypeUnit: nextUnitId }),
          ...(next.scope === "project" && {
            prototypeProject: nextProject.id,
            prototypeTab: next.tab ?? tab,
          }),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const props = { navigate, project, scope, tab, unit };

  return (
    <>
      {variant === "A" && <VariantA {...props} />}
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      <PrototypeSwitcher current={variant} />
    </>
  );
};

export default ScopeInteractionPrototype;
