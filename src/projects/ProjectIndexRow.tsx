import { Box, Chip, ListItemButton, ListItemText, Stack } from "@mui/material";
import Link from "next/link";

import { NextIcon, PrivateIcon, ProjectIcon, PublicIcon } from "../components/icons";
import { RoleIcon } from "../components/kindIcons";
import { toLocalTimeString } from "../utils/app/datetime";
import { formatTierString } from "../utils/app/products";
import { ProjectIdentity } from "./ProjectIdentity";
import { type ProjectIndexItem } from "./projectIndex";
import { projectLinks } from "./routes";

/**
 * Whether a project is private, stated in both directions. An absent marking would be ambiguous
 * between "public" and "this screen does not report privacy", so the row always says which it is,
 * and says it in text as well as in an icon: a column nothing but sighted scanning can read would
 * be information a screen-reader user is excluded from.
 */
const PrivacyIcon = ({ isPrivate }: { isPrivate: boolean }) => {
  const label = isPrivate ? "Private" : "Public";
  const Icon = isPrivate ? PrivateIcon : PublicIcon;
  return <Icon sx={{ color: "text.secondary", fontSize: 18 }} titleAccess={label} />;
};

/**
 * When a project was created, or nothing where the record cannot say. A legacy project carries no
 * real timestamp and arrives as the epoch, which would otherwise be stated as a confident
 * "01/01/70" — a date the project plainly does not have.
 */
const createdLabel = (created: string) =>
  Date.parse(created) > 0 ? `Created ${toLocalTimeString(created, true, false)}` : undefined;

/**
 * One project as the index offers it: what distinguishes it, and that it can be opened.
 *
 * The trailing chevron is the resting-state affordance. Without it the rows read as inert text
 * until the pointer is over one, and the screen is a chooser — a list of destinations rather than a
 * paragraph of names.
 *
 * The role chip sits in a fixed-width slot so the privacy icons beyond it line up into a column
 * down the page. Placed directly after a chip whose width follows its label, they would not, and a
 * marking that has to be read row by row is not one that can be scanned.
 */
export const ProjectIndexRow = ({
  flavour,
  isPrivate,
  project,
  roleLabel,
  unitName,
}: ProjectIndexItem) => (
  <ListItemButton
    component={Link}
    href={projectLinks.files(project.project_id) as never}
    sx={{ borderRadius: 1, gap: 1 }}
  >
    <ProjectIcon sx={{ color: "text.secondary" }} />
    <ListItemText
      primary={project.name}
      secondary={
        <ProjectIdentity
          createdLabel={createdLabel(project.created)}
          flavourLabel={flavour ? formatTierString(flavour) : undefined}
          unitLabel={unitName}
        />
      }
    />
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", width: 116 }}>
        {roleLabel ? (
          <Chip
            icon={<RoleIcon role={roleLabel} />}
            label={roleLabel}
            size="small"
            variant="outlined"
          />
        ) : null}
      </Box>
      <PrivacyIcon isPrivate={isPrivate} />
    </Stack>
    <NextIcon sx={{ color: "text.secondary" }} />
  </ListItemButton>
);
