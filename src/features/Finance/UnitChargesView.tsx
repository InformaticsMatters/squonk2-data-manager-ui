import { type UnitAllDetail } from "@squonk/account-server-client";
import { useGetUnit } from "@squonk/account-server-client/unit";

import Head from "next/head";

import { UnitCharges } from "../../components/finance/UnitCharges";

export interface UnitChargesViewProps {
  unitId: UnitAllDetail["id"];
}

export const UnitChargesView = ({ unitId }: UnitChargesViewProps) => {
  const { data } = useGetUnit(unitId);

  return (
    <>
      <Head>
        <title>Squonk | {data?.name} Charges</title>
      </Head>
      <UnitCharges unitId={unitId} />
    </>
  );
};
