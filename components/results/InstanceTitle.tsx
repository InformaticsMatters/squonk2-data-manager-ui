import type { InstanceSummary } from "@squonk/data-manager-client";
import { useGetInstance } from "@squonk/data-manager-client/instance";

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
