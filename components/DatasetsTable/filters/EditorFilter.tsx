import type { UserSummary } from '@squonk/data-manager-client';

import { UserFilter } from './UserFilter';

export interface EditorFilterProps {
  /**
   * Selected editor.
   */
  editor?: UserSummary;
  /**
   * Function to set selected editor.
   */
  setEditor: (editor?: UserSummary) => void;
}

/**
 * Component which adjusts filtering of datasets according to editor.
 */
export const EditorFilter = ({ editor, setEditor }: EditorFilterProps) => {
  return (
    <UserFilter
      id="datasets-editor-filter"
      label="Filter by editor"
      setUser={setEditor}
      user={editor}
    />
  );
};
