import { type UnitAllDetail } from "@/api/account-server";
import { useGetUnit } from "@/api/account-server/unit";

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
