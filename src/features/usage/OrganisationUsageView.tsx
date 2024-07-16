import { useGetOrganisation } from "@squonk/account-server-client/organisation";

import Head from "next/head";

import { OrganisationUserUsage } from "../../components/usage/OrganisationUserUsage";

export interface OrganisationUsageViewProps {
  organisationId: string;
}

export const OrganisationUsageView = ({ organisationId }: OrganisationUsageViewProps) => {
  const { data } = useGetOrganisation(organisationId);
  return (
    <>
      <Head>
        <title>Squonk | {data?.name} - User Usage</title>
      </Head>
      <OrganisationUserUsage organisationId={organisationId} />
    </>
  );
};
