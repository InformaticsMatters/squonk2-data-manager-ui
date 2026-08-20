import { type UnitAllDetail } from "@/api/account-server";

import {
  ArrowForwardRounded,
  BusinessRounded,
  FolderRounded,
  InboxRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { PersonalUnitCreation } from "./PersonalUnitCreation";
import { type ProjectOnboardingDecision } from "./projectIndex";
import { projectLinks } from "./routes";

/**
 * Where the thing about to be created sits. The hierarchy is the one fact a caller needs before
 * either step makes sense, so it is drawn once rather than restated in both of them.
 */
const hierarchy = [
  { icon: <BusinessRounded fontSize="small" />, label: "Organisation" },
  { icon: <InboxRounded fontSize="small" />, label: "Unit" },
  { icon: <FolderRounded fontSize="small" />, label: "Project" },
] as const;

const Hierarchy = () => (
  <Stack
    aria-label="An organisation contains units, and a unit owns projects"
    direction="row"
    role="img"
    sx={{ alignItems: "center", flexWrap: "wrap", gap: 1, my: 2 }}
  >
    {hierarchy.map(({ icon, label }, index) => (
      <Stack direction="row" key={label} sx={{ alignItems: "center", gap: 1 }}>
        {index > 0 ? <ArrowForwardRounded color="disabled" fontSize="small" /> : null}
        <Stack
          component={Paper}
          direction="row"
          sx={{ alignItems: "center", gap: 0.5, px: 1.5, py: 0.75 }}
          variant="outlined"
        >
          {icon}
          <Typography sx={{ fontWeight: 700 }} variant="body2">
            {label}
          </Typography>
        </Stack>
      </Stack>
    ))}
  </Stack>
);

const ConceptsLink = ({ children }: { children: string }) => (
  <MuiLink component={Link} href="/docs/concepts">
    {children}
  </MuiLink>
);

/**
 * The way into a project of the caller's own, offered by the projects index itself.
 *
 * It creates the personal unit and then hands off to the ordinary project-creation screen with that
 * unit already named. Nothing here creates a subscription or a project: that screen keeps sole
 * ownership of the cross-service lifecycle and of the recovery record that makes a partial failure
 * survivable, and a second implementation of it is exactly what made the removed bootstrapper
 * unrecoverable.
 */
export const ProjectOnboarding = ({
  decision,
  onDismiss,
  personalUnit,
}: {
  decision: ProjectOnboardingDecision;
  /** Absent when the caller has no project they can write to, because the offer is then the only way in. */
  onDismiss?: () => void;
  /**
   * The caller's personal unit, read once by the index that decides whether to show this panel.
   * It is passed rather than read again here on purpose: the index only shows the panel once that
   * read has settled, so a second subscription would refetch on mount, unsettle the read, and take
   * the panel away from under itself.
   */
  personalUnit: UnitAllDetail | undefined;
}) => {
  /**
   * The unit step is always on the panel; what changes is whether it asks for something or reports
   * something. A caller who has a personal unit is told so by name rather than being shown a step
   * that silently isn't there — which is the state a returning caller who deleted the project in
   * their unit arrives in, and the state a caller who just created one, or created one in a second
   * tab, ends up in. Only the unit's own existence decides which, so no attempt's outcome is
   * remembered here.
   */
  const unitStepIsDone = !decision.personalUnitStepApplies;

  return (
    <Paper sx={{ p: 3 }} variant="outlined">
      <Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">
        Start working in a project of your own
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        An <strong>organisation</strong> contains <strong>units</strong>, and a unit owns and pays
        for the <strong>projects</strong> inside it. Your files, the work you run and the people you
        share it with all live in a project.
      </Typography>
      <Hierarchy />
      <Typography color="text.secondary">
        <ConceptsLink>Read more about organisations, units and projects</ConceptsLink>.
      </Typography>

      <Stepper activeStep={unitStepIsDone ? 1 : 0} orientation="vertical" sx={{ mt: 3 }}>
        <Step expanded completed={unitStepIsDone}>
          <StepLabel>{personalUnit ? "Your personal unit" : "Create your personal unit"}</StepLabel>
          <StepContent>
            <Typography color="text.secondary">
              A unit is the billing container that owns projects and pays for what they use. Yours
              is your own, sits in the default organisation, and nobody else works in it.
            </Typography>
            <Box sx={{ mt: 2 }}>
              {personalUnit ? (
                <Alert severity="success">
                  You already have a personal unit, {personalUnit.name}, and your project can go in
                  it.
                </Alert>
              ) : (
                <PersonalUnitCreation />
              )}
            </Box>
          </StepContent>
        </Step>
        <Step expanded>
          <StepLabel>Create your first project</StepLabel>
          <StepContent>
            <Typography color="text.secondary">
              A project holds your files and the work you run in them. Creating one takes out a{" "}
              <strong>subscription</strong> in the unit that owns it — the tier you choose on the
              next screen decides how much that unit pays for and how much you can run.
            </Typography>
            <Box sx={{ mt: 2 }}>
              {/* The unit travels with the handoff rather than being left to be worked out again,
                  which is what a caller with several eligible units needs to see the one meant. */}
              {unitStepIsDone ? (
                <Button
                  component={Link}
                  href={projectLinks.create(personalUnit ? { unitId: personalUnit.id } : {})}
                  variant="contained"
                >
                  Create project
                </Button>
              ) : (
                <Button disabled variant="contained">
                  Create project
                </Button>
              )}
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      {onDismiss ? (
        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={onDismiss}>Not now</Button>
        </Stack>
      ) : null}
    </Paper>
  );
};
