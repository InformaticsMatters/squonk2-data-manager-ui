import type { Dispatch } from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import type { OrganisationDetail, UnitGetResponse } from '@squonk/account-server-client';
import { useGetProduct } from '@squonk/account-server-client/product';

import { useCurrentProject } from '../hooks/projectHooks';
import { useIsAuthorized } from '../hooks/useIsAuthorized';

type OrganisationUnit = {
  organisation: OrganisationDetail | null;
  unit: UnitGetResponse | null;
};

type OrganisationUnitContextValue = {
  organisationUnit: OrganisationUnit;
  dispatchOrganisationUnit: OrganisationUnitSetter;
};

export const OrganisationUnitContext = createContext<OrganisationUnitContextValue>({
  organisationUnit: { organisation: null, unit: null },
  dispatchOrganisationUnit: () => {
    // Do nothing
  },
});

interface OrganisationUnitUpdaterProps {
  dispatchOrganisationUnit: OrganisationUnitSetter;
}

/**
 * Updates organisation unit context based on the user state and project URL.
 */
const OrganisationUnitUpdater = ({ dispatchOrganisationUnit }: OrganisationUnitUpdaterProps) => {
  const isAuthorized = useIsAuthorized();

  const currentProject = useCurrentProject();
  const { data: product } = useGetProduct(
    currentProject?.unit_id ?? '',
    currentProject?.product_id ?? '',
    { query: { enabled: !!currentProject?.unit_id && !!currentProject.product_id } },
  );

  useEffect(() => {
    // On logout clear context
    if (!isAuthorized) {
      dispatchOrganisationUnit({ type: 'clear' });
    }
  }, [isAuthorized, dispatchOrganisationUnit]);

  useEffect(() => {
    // Used in case a user directly navigates to a project's URL
    if (currentProject && product) {
      dispatchOrganisationUnit({
        type: 'setOrganisationUnit',
        payload: {
          organisation: product.product.organisation,
          unit: product.product.unit,
        },
      });
    }
  }, [currentProject, product, dispatchOrganisationUnit]);

  return null;
};

type OrganisationUnitActions =
  | { type: 'clear' }
  | { type: 'setOrganisation'; payload: OrganisationUnit['organisation'] }
  | { type: 'setUnit'; payload: OrganisationUnit['unit'] }
  | { type: 'setOrganisationUnit'; payload: OrganisationUnit };

type OrganisationUnitSetter = Dispatch<OrganisationUnitActions>;

const organisationUnitReducer = (
  state: OrganisationUnit,
  action: OrganisationUnitActions,
): OrganisationUnit => {
  switch (action.type) {
    case 'clear': {
      return { organisation: null, unit: null };
    }
    case 'setOrganisation': {
      // If organisation changed, reset unit as well
      return { organisation: action.payload, unit: null };
    }
    case 'setUnit': {
      // Only change the unit
      return { ...state, unit: action.payload };
    }
    case 'setOrganisationUnit': {
      const { organisation, unit } = action.payload;
      return { organisation, unit };
    }
    default:
      return state;
  }
};

export const OrganisationUnitProvider: React.FC = ({ children }) => {
  const isAuthorized = useIsAuthorized();

  const [organisationUnit, dispatchOrganisationUnit] = useReducer(organisationUnitReducer, {
    organisation: null,
    unit: null,
  });

  const contextValue = useMemo(
    () => ({
      organisationUnit,
      dispatchOrganisationUnit,
    }),
    [organisationUnit],
  );

  return (
    <OrganisationUnitContext.Provider value={contextValue}>
      {isAuthorized && (
        <OrganisationUnitUpdater dispatchOrganisationUnit={dispatchOrganisationUnit} />
      )}
      {children}
    </OrganisationUnitContext.Provider>
  );
};

export const useOrganisationUnit = () => {
  return useContext(OrganisationUnitContext);
};

export const useCurrentOrg = () => {
  const { organisationUnit } = useOrganisationUnit();
  return organisationUnit.organisation;
};

export const useCurrentUnit = () => {
  const { organisationUnit } = useOrganisationUnit();
  return organisationUnit.unit;
};
