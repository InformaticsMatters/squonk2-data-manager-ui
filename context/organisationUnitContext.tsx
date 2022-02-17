import type { Dispatch } from 'react';
import { useReducer } from 'react';
import { useMemo } from 'react';
import { useContext } from 'react';
import { useEffect } from 'react';
import { createContext } from 'react';

import type { OrganisationDetail, UnitDetail } from '@squonk/account-server-client';
import { useGetProduct } from '@squonk/account-server-client/product';

import { useCurrentProject } from '../hooks/projectHooks';
import { useIsAuthorized } from '../hooks/useIsAuthorized';

type OrganisationUnit = {
  organisation: OrganisationDetail | null;
  unit: UnitDetail | null;
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

const useUpdateOrganisationUnit = (dispatchOrganisationUnit: OrganisationUnitSetter) => {
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
  const [organisationUnit, dispatchOrganisationUnit] = useReducer(organisationUnitReducer, {
    organisation: null,
    unit: null,
  });

  useUpdateOrganisationUnit(dispatchOrganisationUnit);

  const contextValue = useMemo(
    () => ({
      organisationUnit,
      dispatchOrganisationUnit,
    }),
    [organisationUnit],
  );

  return (
    <OrganisationUnitContext.Provider value={contextValue}>
      {children}
    </OrganisationUnitContext.Provider>
  );
};

export const useOrganisationUnit = () => {
  return useContext(OrganisationUnitContext);
};
