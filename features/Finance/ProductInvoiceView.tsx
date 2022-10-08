import type { ProductDetail } from "@squonk/account-server-client";
import { useGetProduct } from "@squonk/account-server-client/product";

import Head from "next/head";

import { ProductInvoice } from "../../components/finance/ProductInvoice";

export interface ProductInvoiceViewProps {
  productId: ProductDetail["id"];
}

export const ProductInvoiceView = ({ productId }: ProductInvoiceViewProps) => {
  const { data } = useGetProduct(productId);

  return (
    <>
      <Head>
        <title>Squonk | {data?.product.product.name} Invoice</title>
      </Head>
      <ProductInvoice productId={productId} />
    </>
  );
};
