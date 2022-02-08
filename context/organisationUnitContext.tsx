import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { useContext } from 'react';
import { useEffect } from 'react';
import { useLayoutEffect } from 'react';
import { useState } from 'react';
import { createContext } from 'react';

import { useGetProducts } from '@squonk/account-server-client/product';

import { useCurrentProject } from '../hooks/projectHooks';
import { useIsAuthorized } from '../hooks/useIsAuthorized';

type OrganisationUnit = {
  organisation: string;
  unit: string | null;
};

type OrganisationUnitSetter = Dispatch<SetStateAction<OrganisationUnit | null>>;

type OrganisationUnitContextValue = {
  organisationUnit: OrganisationUnit | null;
  setOrganisationUnit: OrganisationUnitSetter;
};

export const OrganisationUnitContext = createContext<OrganisationUnitContextValue>({
  organisationUnit: null,
  setOrganisationUnit: () => {
    // Do nothing
  },
});

const useUpdateOrganisationUnit = (setOrganisationUnit: OrganisationUnitSetter) => {
  const isAuthorized = useIsAuthorized();

  const currentProject = useCurrentProject();
  const { data: products } = useGetProducts();

  useLayoutEffect(() => {
    if (!currentProject || !products) {
      setOrganisationUnit(null);
    }
  }, [currentProject, products, setOrganisationUnit]);

  useLayoutEffect(() => {
    if (!isAuthorized) {
      setOrganisationUnit(null);
    }
  }, [isAuthorized, setOrganisationUnit]);

  useEffect(() => {
    if (currentProject && products) {
      const product = products.products.find(
        (product) => product.product.id === currentProject.product_id,
      );

      if (product) {
        setOrganisationUnit({
          organisation: product.organisation.name,
          unit: product.unit.name,
        });
      }
    }
  }, [currentProject, products, setOrganisationUnit]);
};

export const OrganisationUnitProvider: React.FC = ({ children }) => {
  const [organisationUnit, setOrganisationUnit] = useState<OrganisationUnit | null>(null);

  useUpdateOrganisationUnit(setOrganisationUnit);

  const contextValue = useMemo(
    () => ({
      organisationUnit,
      setOrganisationUnit,
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
