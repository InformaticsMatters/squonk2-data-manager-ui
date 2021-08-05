import type { ProjectId } from '../../state/currentProjectHooks';

export type NoUndefProjectId = NonNullable<ProjectId>;
export type FileOrDirectory = 'file' | 'directory';
export type Selection = string[] | string | undefined;

export interface SharedProps {
  targetType: FileOrDirectory;
  mimeTypes?: string[];
  multiple: boolean;
  projectId: NoUndefProjectId;
  value?: string[] | string;
  onSelect: (selection: Selection) => void;
}
