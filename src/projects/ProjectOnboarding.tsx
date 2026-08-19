import { useRef } from "react";

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

import { type ProjectOnboardingDecision } from "./projectIndex";
import { projectLinks } from "./routes";
import { usePersonalUnitCreation } from "./usePersonalUnitCreation";

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
}: {
  decision: ProjectOnboardingDecision;
  /** Absent when the caller has no project they can write to, because the offer is then the only way in. */
  onDismiss?: () => void;
}) => {
  const { createPersonalUnit, personalUnit, state } = usePersonalUnitCreation();
  /**
   * Whether this caller was offered the first step when they arrived. It is taken once and then
   * kept, so a step that has just succeeded reports that success rather than vanishing from under
   * the caller who took it — which is also what a duplicate attempt from a second tab reads as. A
   * caller who already had a personal unit is never shown the step at all.
   */
  const unitStepApplies = useRef(decision.personalUnitStepApplies).current;
  // Whether the step is done is settled by the unit itself, never by what this attempt did.
  const unitStepIsDone = !unitStepApplies || personalUnit !== undefined;
  const creating = state.kind === "creating";

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
        {unitStepApplies ? (
          <Step expanded completed={personalUnit !== undefined}>
            <StepLabel>Create your personal unit</StepLabel>
            <StepContent>
              <Typography color="text.secondary">
                A unit is the billing container that owns projects and pays for what they use. Yours
                is your own, sits in the default organisation, and nobody else works in it.
              </Typography>
              {state.kind === "failed" ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {state.reason}
                </Alert>
              ) : null}
              {personalUnit ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  You have a personal unit: {personalUnit.name}.
                </Alert>
              ) : (
                <Button
                  disabled={creating}
                  sx={{ mt: 2 }}
                  variant="contained"
                  onClick={() => void createPersonalUnit()}
                >
                  {creating ? "Creating..." : "Create personal unit"}
                </Button>
              )}
            </StepContent>
          </Step>
        ) : null}
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
