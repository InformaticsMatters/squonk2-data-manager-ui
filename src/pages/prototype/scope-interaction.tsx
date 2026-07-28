/**
 * PROTOTYPE: Three primary-tab behaviors for explicit unit/project scope, switchable via ?variant=.
 * The shared shell and fake content stay fixed so only the interaction model changes.
 */
import { useEffect, useState } from "react";

import {
  AdminPanelSettingsRounded,
  ArrowBackRounded,
  ArrowForwardRounded,
  BusinessRounded,
  ChevronRightRounded,
  DataObjectRounded,
  FolderRounded,
  KeyboardArrowDownRounded,
  MenuBookRounded,
  PersonRounded,
  ScienceRounded,
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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

type Chooser = "data" | "project" | null;
type VariantKey = "A" | "B" | "C";
type View = "admin" | "data" | "dataIndex" | "home" | "project" | "projectIndex";

interface Project {
  id: string;
  name: string;
  unitId: string;
  updated: string;
}

interface Unit {
  detail: string;
  id: string;
  name: string;
}

const units: Unit[] = [
  { detail: "18 datasets", id: "01K0V5M7P2C8TQ4NY1J6F3A9BX", name: "Discovery" },
  { detail: "7 datasets", id: "01K0V5P9R8D2MW6GX4H1N7C3QF", name: "Screening" },
  { detail: "11 datasets", id: "01K0V5S3K7B1YX9NE6Q4T8M2DH", name: "Informatics" },
];

const projects: Project[] = [
  {
    id: "01K0V62F3N8YQ5M1HT7C9J4XBP",
    name: "Kinase screen",
    unitId: units[0].id,
    updated: "12 min ago",
  },
  {
    id: "01K0V65R9C2MW7X4BQ8H1T6NYF",
    name: "Kinase screen",
    unitId: units[1].id,
    updated: "Yesterday",
  },
  {
    id: "01K0V68T1H7DQ3N9YP5C2M4XBG",
    name: "Assay QC",
    unitId: units[1].id,
    updated: "3 hours ago",
  },
  {
    id: "01K0V6B4M8X2TC7QH1N5Y9D3PF",
    name: "Spring release",
    unitId: units[2].id,
    updated: "Monday",
  },
];

const variantNames: Record<VariantKey, string> = {
  A: "Choose on tab click",
  B: "Open an index",
  C: "Resume last scope",
};

const projectTabs = ["Files", "Run", "Results", "Manage"];

const valueFromQuery = (value: string[] | string | undefined) =>
  typeof value === "string" ? value : undefined;

const getUnit = (id: string) => units.find((unit) => unit.id === id) ?? units[0];
const getProject = (id: string) => projects.find((project) => project.id === id) ?? projects[0];

const canonicalPath = (view: View, unit: Unit, project: Project, tab: string) => {
  if (view === "dataIndex") {
    return "/data";
  }
  if (view === "projectIndex") {
    return "/projects";
  }
  if (view === "data") {
    return `/units/${unit.id}/data`;
  }
  if (view === "project") {
    return `/units/${unit.id}/projects/${project.id}/${tab.toLowerCase()}`;
  }
  if (view === "admin") {
    return "/administration";
  }
  return "/";
};

interface NavigateOptions {
  projectId?: string;
  tab?: string;
  unitId?: string;
  view: View;
}

interface SharedProps {
  navigate: (next: NavigateOptions) => void;
  project: Project;
  tab: string;
  unit: Unit;
  variant: VariantKey;
  view: View;
}

const OrganisationIdentity = ({ onHome }: { onHome: () => void }) => (
  <Button color="inherit" sx={{ minWidth: 0, p: 0, textTransform: "none" }} onClick={onHome}>
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      <Avatar sx={{ bgcolor: "#db4b32", height: 36, width: 36 }}>
        <ScienceRounded fontSize="small" />
      </Avatar>
      <Box sx={{ minWidth: 0, textAlign: "left" }}>
        <Typography noWrap sx={{ fontWeight: 800, lineHeight: 1.05 }}>
          Acme Research
        </Typography>
        <Typography noWrap color="text.secondary" sx={{ fontSize: 11 }}>
          SQUONK DATA MANAGER
        </Typography>
      </Box>
    </Stack>
  </Button>
);

const PrimaryButton = ({
  active,
  children,
  menu,
  onClick,
}: {
  active: boolean;
  children: string;
  menu?: boolean;
  onClick: () => void;
}) => (
  <Button
    color={active ? "primary" : "inherit"}
    endIcon={menu ? <KeyboardArrowDownRounded /> : undefined}
    sx={{
      borderBottom: 3,
      borderBottomColor: active ? "primary.main" : "transparent",
      borderRadius: 0,
      minHeight: 64,
      minWidth: { xs: 74, sm: 100 },
      px: { xs: 1, sm: 2 },
      textTransform: "none",
    }}
    onClick={onClick}
  >
    {children}
  </Button>
);

const SharedShell = ({ navigate, project, tab, unit, variant, view }: SharedProps) => {
  const [chooser, setChooser] = useState<Chooser>(null);
  const projectActive = view === "project" || view === "projectIndex";
  const dataActive = view === "data" || view === "dataIndex";

  const activatePrimary = (target: Exclude<Chooser, null>) => {
    if (variant === "A") {
      setChooser(target);
      return;
    }
    if (variant === "B") {
      navigate({ view: target === "project" ? "projectIndex" : "dataIndex" });
      return;
    }
    if (target === "project") {
      navigate({ projectId: projects[0].id, tab: "Files", view: "project" });
    } else {
      navigate({ unitId: units[0].id, view: "data" });
    }
  };

  return (
    <Box sx={{ bgcolor: "#f6f7f7", minHeight: "100vh", pb: 10 }}>
      <AppBar color="inherit" elevation={0} position="static">
        <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: { xs: 0.5, sm: 2 } }}>
          <OrganisationIdentity onHome={() => navigate({ view: "home" })} />
          <Stack direction="row" sx={{ alignSelf: "stretch", ml: "auto" }}>
            <PrimaryButton
              active={projectActive}
              menu={variant === "A"}
              onClick={() => activatePrimary("project")}
            >
              Project
            </PrimaryButton>
            <PrimaryButton
              active={dataActive}
              menu={variant === "A"}
              onClick={() => activatePrimary("data")}
            >
              Data
            </PrimaryButton>
            <PrimaryButton active={view === "admin"} onClick={() => navigate({ view: "admin" })}>
              Admin
            </PrimaryButton>
          </Stack>
          <IconButton sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            <PersonRounded />
          </IconButton>
        </Toolbar>

        {view === "project" && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{ alignItems: { sm: "center" }, maxWidth: 1120, mx: "auto", px: 2 }}
            >
              <Button
                color="inherit"
                endIcon={<KeyboardArrowDownRounded />}
                sx={{ justifyContent: "flex-start", textTransform: "none" }}
                onClick={() => setChooser("project")}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
                    {project.name}
                  </Typography>
                  <Typography noWrap color="text.secondary" sx={{ fontSize: 11 }}>
                    {unit.name} unit
                  </Typography>
                </Box>
              </Button>
              <Tabs
                sx={{ ml: { sm: "auto" }, maxWidth: "100%" }}
                value={projectTabs.includes(tab) ? tab : "Files"}
                variant="scrollable"
                onChange={(_, next: string) => navigate({ tab: next, view: "project" })}
              >
                {projectTabs.map((item) => (
                  <Tab key={item} label={item} value={item} />
                ))}
              </Tabs>
            </Stack>
          </Box>
        )}

        {variant === "C" && !!(projectActive || dataActive) && (
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 0.75 }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center" }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                Resumed {projectActive ? `${project.name} in ${unit.name}` : `${unit.name} Data`}
              </Typography>
              <Button size="small" onClick={() => setChooser(projectActive ? "project" : "data")}>
                Switch
              </Button>
            </Stack>
          </Box>
        )}
      </AppBar>

      <Box sx={{ maxWidth: 1120, mx: "auto", p: { xs: 2, md: 4 } }}>
        <RouteIndicator path={canonicalPath(view, unit, project, tab)} />
        <Box sx={{ mt: 3 }}>
          {view === "home" && <HomeContent navigate={navigate} />}
          {view === "projectIndex" && <ProjectIndex navigate={navigate} />}
          {view === "dataIndex" && <DataIndex navigate={navigate} />}
          {view === "project" && <ProjectContent project={project} tab={tab} unit={unit} />}
          {view === "data" && <DataContent unit={unit} />}
          {view === "admin" && <AdminContent />}
        </Box>
      </Box>

      <ScopeChooser
        kind={chooser}
        onClose={() => setChooser(null)}
        onProject={(next) => {
          navigate({ projectId: next.id, tab: "Files", view: "project" });
          setChooser(null);
        }}
        onUnit={(next) => {
          navigate({ unitId: next.id, view: "data" });
          setChooser(null);
        }}
      />
    </Box>
  );
};

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
    Canonical route: {path}
  </Box>
);

const HomeContent = ({ navigate }: Pick<SharedProps, "navigate">) => (
  <Stack spacing={4}>
    <Box>
      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
        Welcome back, Oliver
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 850 }} variant="h3">
        Pick up where you left off
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
        {projects.slice(0, 3).map((item) => (
          <Paper key={item.id} sx={{ flex: 1, p: 2.5 }} variant="outlined">
            <Chip label={`${getUnit(item.unitId).name} project`} size="small" />
            <Typography sx={{ fontWeight: 800, mt: 2 }} variant="h6">
              {item.name}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              Opened {item.updated}
            </Typography>
            <Button
              sx={{ mt: 2 }}
              onClick={() => navigate({ projectId: item.id, tab: "Files", view: "project" })}
            >
              Continue
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>

    <Divider />

    <Stack direction={{ xs: "column", md: "row" }} spacing={5}>
      <Box sx={{ flex: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 800 }} variant="h5">
          Welcome to Squonk Data Manager
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          Run scientific workflows in a managed, collaborative environment. Shared, standardised
          datasets stay in one place while compute comes to the data.
        </Typography>
        <Typography sx={{ fontWeight: 750, mt: 3 }}>Quick start</Typography>
        <Typography color="text.secondary" component="ol" sx={{ lineHeight: 1.8, pl: 2.5 }}>
          <li>Open or create a project.</li>
          <li>Work with intermediate files, scripts, and notebooks.</li>
          <li>Attach a shared dataset from the Data library when needed.</li>
          <li>Run workflows and inspect their results.</li>
        </Typography>
      </Box>
      <Paper sx={{ flex: 1, p: 3 }} variant="outlined">
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <MenuBookRounded color="primary" />
          <Typography component="h2" sx={{ fontWeight: 800 }} variant="h5">
            Documentation
          </Typography>
        </Stack>
        {["Concepts", "Guided tour", "How-to guides", "Deployed jobs"].map((item) => (
          <Button
            fullWidth
            endIcon={<ChevronRightRounded />}
            key={item}
            sx={{ justifyContent: "space-between", mt: 1 }}
          >
            {item}
          </Button>
        ))}
      </Paper>
    </Stack>
  </Stack>
);

const ProjectIndex = ({ navigate }: Pick<SharedProps, "navigate">) => (
  <Box>
    <Typography component="h1" sx={{ fontWeight: 850 }} variant="h4">
      Projects
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      Projects hold active research files, scripts, notebooks, workflow runs, and results.
    </Typography>
    <Stack spacing={1.5}>
      {projects.map((item) => (
        <Paper key={item.id} variant="outlined">
          <ListItemButton
            onClick={() => navigate({ projectId: item.id, tab: "Files", view: "project" })}
          >
            <ListItemIcon>
              <FolderRounded color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={`${getUnit(item.unitId).name} unit · ${item.updated}`}
            />
            <ChevronRightRounded />
          </ListItemButton>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const DataIndex = ({ navigate }: Pick<SharedProps, "navigate">) => (
  <Box>
    <Typography component="h1" sx={{ fontWeight: 850 }} variant="h4">
      Data
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      Datasets are shared, standardised resources owned by a unit. Choose a unit&apos;s library.
    </Typography>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      {units.map((item) => (
        <Paper key={item.id} sx={{ flex: 1, p: 2.5 }} variant="outlined">
          <BusinessRounded color="primary" />
          <Typography sx={{ fontWeight: 800, mt: 2 }} variant="h6">
            {item.name}
          </Typography>
          <Typography color="text.secondary">{item.detail}</Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate({ unitId: item.id, view: "data" })}>
            Open dataset library
          </Button>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const ProjectContent = ({ project, tab, unit }: { project: Project; tab: string; unit: Unit }) => (
  <Stack spacing={2.5}>
    <Box>
      <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
        {unit.name} unit · Project ID {project.id}
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 850 }} variant="h4">
        {project.name}
      </Typography>
    </Box>
    <Paper sx={{ overflow: "hidden" }} variant="outlined">
      {["inputs", "analysis.ipynb", "screening.py", "reports"].map((name, index) => (
        <Stack
          direction="row"
          key={name}
          spacing={2}
          sx={{
            alignItems: "center",
            borderBottom: index === 3 ? 0 : 1,
            borderColor: "divider",
            px: 2,
            py: 1.5,
          }}
        >
          <FolderRounded color={index === 0 || index === 3 ? "primary" : "disabled"} />
          <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, ml: "auto !important" }}>
            {index === 0 ? "8 files" : index === 3 ? "2 files" : "Intermediate research file"}
          </Typography>
        </Stack>
      ))}
    </Paper>
    <Typography color="text.secondary">
      Showing {tab}. A dataset attached from Data becomes available to this project without being
      reduced to an ordinary project file.
    </Typography>
  </Stack>
);

const DataContent = ({ unit }: { unit: Unit }) => (
  <Stack spacing={2.5}>
    <Box>
      <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>
        {unit.name} unit · Unit ID {unit.id}
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 850 }} variant="h4">
        Dataset library
      </Typography>
    </Box>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      {["ChEMBL 35", "Enamine REAL", "Approved drugs"].map((name, index) => (
        <Paper key={name} sx={{ flex: 1, p: 2.5 }} variant="outlined">
          <DataObjectRounded color={index === 0 ? "primary" : "disabled"} />
          <Typography sx={{ fontWeight: 800, mt: 2 }}>{name}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Standardised · Version {35 - index}.0 · Shared with {4 + index} projects
          </Typography>
          <Button sx={{ mt: 2 }}>View dataset</Button>
        </Paper>
      ))}
    </Stack>
    <Paper sx={{ bgcolor: "#edf6f4", p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 750 }}>Datasets are more than project files</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        They are curated, versioned, reusable resources. Attachment starts here and requires an
        explicit target project.
      </Typography>
    </Paper>
  </Stack>
);

const AdminContent = () => (
  <Box>
    <AdminPanelSettingsRounded color="primary" fontSize="large" />
    <Typography component="h1" sx={{ fontWeight: 850, mt: 1 }} variant="h4">
      Administration
    </Typography>
    <Typography color="text.secondary">
      Organisation, units, people, products, usage, and billing tasks live here.
    </Typography>
  </Box>
);

interface ScopeChooserProps {
  kind: Chooser;
  onClose: () => void;
  onProject: (project: Project) => void;
  onUnit: (unit: Unit) => void;
}

const ScopeChooser = ({ kind, onClose, onProject, onUnit }: ScopeChooserProps) => (
  <Dialog fullWidth maxWidth="sm" open={kind !== null} onClose={onClose}>
    <DialogTitle>{kind === "data" ? "Choose a unit's Data" : "Choose a project"}</DialogTitle>
    <DialogContent>
      <List>
        {(kind === "data" ? units : projects).map((item) => (
          <ListItemButton
            key={item.id}
            onClick={() => (kind === "data" ? onUnit(item as Unit) : onProject(item as Project))}
          >
            <ListItemIcon>
              {kind === "data" ? <DataObjectRounded /> : <FolderRounded />}
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              secondary={
                kind === "data"
                  ? (item as Unit).detail
                  : `${getUnit((item as Project).unitId).name} unit · ID ${item.id}`
              }
            />
            <ChevronRightRounded />
          </ListItemButton>
        ))}
      </List>
    </DialogContent>
  </Dialog>
);

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
      <Box sx={{ minWidth: { xs: 170, sm: 230 }, px: 1, textAlign: "center" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
          {current} · {variantNames[current]}
        </Typography>
        <Typography sx={{ fontSize: 10, opacity: 0.65 }}>
          Only primary-tab behavior changes
        </Typography>
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
  const viewValue = valueFromQuery(router.query.prototypeView);
  const validViews: View[] = ["admin", "data", "dataIndex", "home", "project", "projectIndex"];
  const view: View = validViews.includes(viewValue as View) ? (viewValue as View) : "home";
  const project = getProject(valueFromQuery(router.query.prototypeProject) ?? projects[0].id);
  const requestedUnit = getUnit(valueFromQuery(router.query.prototypeUnit) ?? units[0].id);
  const unit = view === "project" ? getUnit(project.unitId) : requestedUnit;
  const tab = valueFromQuery(router.query.prototypeTab) ?? "Files";

  const navigate = (next: NavigateOptions) => {
    const nextProject = next.projectId ? getProject(next.projectId) : project;
    const nextUnitId = next.view === "project" ? nextProject.unitId : (next.unitId ?? unit.id);
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          variant,
          prototypeView: next.view,
          ...(next.view === "data" && { prototypeUnit: nextUnitId }),
          ...(next.view === "project" && {
            prototypeProject: nextProject.id,
            prototypeTab: next.tab ?? tab,
            prototypeUnit: nextUnitId,
          }),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <>
      <SharedShell
        navigate={navigate}
        project={project}
        tab={tab}
        unit={unit}
        variant={variant}
        view={view}
      />
      <PrototypeSwitcher current={variant} />
    </>
  );
};

export default ScopeInteractionPrototype;
