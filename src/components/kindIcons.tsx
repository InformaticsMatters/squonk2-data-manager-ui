import { type SvgIconProps } from "@mui/material";

import { type DefinitionKind } from "../constants/definitionKinds";
import { type FileKind, fileKindConcept } from "../projects/fileKinds";
import {
  AdministratorIcon,
  ApplicationIcon,
  ArchiveFileIcon,
  CreatorIcon,
  EditorIcon,
  FileIcon,
  ImageFileIcon,
  JobIcon,
  MoleculeIcon,
  NotebookFileIcon,
  ObserverIcon,
  StructuredFileIcon,
  TableFileIcon,
  TextFileIcon,
  WorkflowIcon,
} from "./icons";

/**
 * Icons for the things that come in kinds: files, definitions and project roles. Each picks the
 * concept icon for one member of the kind, so every place that draws a kind draws it the same way.
 */

const fileKindIcons = {
  archiveFile: ArchiveFileIcon,
  file: FileIcon,
  imageFile: ImageFileIcon,
  molecule: MoleculeIcon,
  notebookFile: NotebookFileIcon,
  structuredFile: StructuredFileIcon,
  tableFile: TableFileIcon,
  textFile: TextFileIcon,
} satisfies Record<FileKind, unknown>;

/** The icon for the kind of file a name says it is. */
export const FileKindIcon = ({ fileName, ...props }: SvgIconProps & { fileName: string }) => {
  const Icon = fileKindIcons[fileKindConcept(fileName)];
  return <Icon {...props} />;
};

const definitionKindIcons = {
  application: ApplicationIcon,
  job: JobIcon,
  workflow: WorkflowIcon,
} satisfies Record<DefinitionKind, unknown>;

/** The icon for a kind of definition: workflow, application or job. */
export const DefinitionKindIcon = ({ kind, ...props }: SvgIconProps & { kind: DefinitionKind }) => {
  const Icon = definitionKindIcons[kind];
  return <Icon {...props} />;
};

/** A role held in a project, as it is named on screen. */
export type RoleLabel = "Administrator" | "Creator" | "Editor" | "Observer";

const roleIcons = {
  Administrator: AdministratorIcon,
  Creator: CreatorIcon,
  Editor: EditorIcon,
  Observer: ObserverIcon,
} satisfies Record<RoleLabel, unknown>;

/** The icon for a role held in a project. */
export const RoleIcon = ({ role, ...props }: SvgIconProps & { role: RoleLabel }) => {
  const Icon = roleIcons[role];
  return <Icon {...props} />;
};
