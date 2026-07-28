import { type ProductDetail } from "@/api/account-server";
import { useGetProduct } from "@/api/account-server/product";

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
