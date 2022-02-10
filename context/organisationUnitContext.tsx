import type { Dispatch } from 'react';
import { useReducer } from 'react';
import { useMemo } from 'react';
import { useContext } from 'react';
import { useEffect } from 'react';
import { createContext } from 'react';

import type { OrganisationDetail, UnitDetail } from '@squonk/account-server-client';
import { useGetProducts } from '@squonk/account-server-client/product';

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
  const { data: products } = useGetProducts();

  useEffect(() => {
    if (!isAuthorized) {
      dispatchOrganisationUnit({ type: 'clear' });
    }
  }, [isAuthorized, dispatchOrganisationUnit]);

  useEffect(() => {
    if (currentProject && products) {
      const product = products.products.find(
        (product) => product.product.id === currentProject.product_id,
      );

      if (product) {
        dispatchOrganisationUnit({
          type: 'setOrganisationUnit',
          payload: {
            organisation: product.organisation,
            unit: product.unit,
          },
        });
      }
    }
  }, [currentProject, products, dispatchOrganisationUnit]);
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
      return { organisation: action.payload, unit: null };
    }
    case 'setUnit': {
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
