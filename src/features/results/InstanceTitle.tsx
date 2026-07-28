import { type InstanceSummary } from "@/api/data-manager";
import { useGetInstance } from "@/api/data-manager/instance";

import Head from "next/head";

export interface InstanceTitleProps {
  instanceId: InstanceSummary["id"];
}

export const InstanceTitle = ({ instanceId }: InstanceTitleProps) => {
  const { data: instance } = useGetInstance(instanceId);
  return (
    <Head>
      <title>Squonk | Instance {instance?.phase}</title>
    </Head>
  );
};
