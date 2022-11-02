import type { ProductDetail } from "@squonk/account-server-client";
import { useGetProduct } from "@squonk/account-server-client/product";

import Head from "next/head";

import { ProductCharges } from "../../components/finance/ProductCharges";

export interface ProductChargesViewProps {
  productId: ProductDetail["id"];
}

export const ProductChargesView = ({ productId }: ProductChargesViewProps) => {
  const { data } = useGetProduct(productId);

  return (
    <>
      <Head>
        <title>Squonk | {data?.product.product.name} Ledger</title>
      </Head>
      <ProductCharges productId={productId} />
    </>
  );
};
