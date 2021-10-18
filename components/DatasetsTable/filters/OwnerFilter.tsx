import type { UserSummary } from '@squonk/data-manager-client';

import { UserFilter } from './UserFilter';

export interface OwnerFilterProps {
  /**
   * Selected owner.
   */
  owner?: UserSummary;
  /**
   * Function to set selected owner.
   */
  setOwner: (owner?: UserSummary) => void;
}

/**
 * Component which adjusts filtering of datasets according to owner.
 */
export const OwnerFilter = ({ owner, setOwner }: OwnerFilterProps) => {
  return (
    <UserFilter
      id="datasets-owner-filter"
      label="Filter by owner"
      setUser={setOwner}
      user={owner}
    />
  );
};
