import { useGetUnit } from "@squonk/account-server-client/unit";

import Head from "next/head";

import { UnitUserUsage } from "../../components/usage/UnitUserUsage";

export interface UnitUsageViewProps {
  unitId: string;
}

export const UnitUsageView = ({ unitId }: UnitUsageViewProps) => {
  const { data } = useGetUnit(unitId);
  return (
    <>
      <Head>
        <title>Squonk | {data?.name} - User Usage</title>
      </Head>
      <UnitUserUsage unitId={unitId} />
    </>
  );
};
