import { useState } from "react";

import type { ProductDetail } from "@squonk/account-server-client";
import { useGetProduct, useGetProductCharges } from "@squonk/account-server-client/product";

import {
  Box,
  Container,
  Divider,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import fileSize from "filesize";

import { toLocalTimeString } from "../../utils/app/datetime";
import { getBillingPeriods } from "../../utils/app/products";
import { CenterLoader } from "../CenterLoader";

export interface ProductChargesProps {
  productId: ProductDetail["id"];
}

export const ProductCharges = ({ productId }: ProductChargesProps) => {
  const [monthDelta, setMonthDelta] = useState(0);
  const { data: chargesData } = useGetProductCharges(productId, { pbp: monthDelta });

  const processingCharges = chargesData?.processing_charges;
  const storageCharges = chargesData?.storage_charges.items;

  const { data: productData } = useGetProduct(productId);

  if (!productData || !chargesData) {
    return <CenterLoader />;
  }

  const periods = getBillingPeriods(
    productData.product.unit.billing_day,
    productData.product.product.created,
  );

  return (
    <Container maxWidth="md">
      <Typography variant="h1">Product Ledger</Typography>
      <Typography variant="subtitle2">{productData.product.product.id}</Typography>
      <Typography gutterBottom component="p" variant="h5">
        Charges against: {productData.product.product.name}
      </Typography>
      <Typography gutterBottom>
        <strong>Billed to</strong>: unit <em>{productData.product.unit.name}</em> belonging to the{" "}
        <em>{productData.product.organisation.name}</em> organisation{" "}
      </Typography>
      <Typography gutterBottom component="h2" variant="h4">
        Billing period
      </Typography>

      <Select
        id="select-billing-cycle"
        size="small"
        value={monthDelta}
        onChange={(event) => {
          setMonthDelta(Number(event.target.value));
        }}
      >
        {periods.map(([i, d1, d2]) => (
          <MenuItem key={d1} value={i}>{`${d1} — ${d2}`}</MenuItem>
        ))}
      </Select>

      <Typography gutterBottom sx={{ mt: 2 }} variant="h2">
        Charges
      </Typography>
      <Paper>
        <Box padding={2}>
          <Typography variant="h4">Processing Charges</Typography>
          <Typography variant="subtitle1">
            Charges from computations, e.g. running Data Manager Jobs
          </Typography>
        </Box>
        <Table size="small" sx={{ marginBottom: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Job</TableCell>
              <TableCell>Job Collection</TableCell>
              <TableCell>Closed</TableCell>
              <TableCell colSpan={4}>Charge</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processingCharges?.length ? (
              processingCharges.map((charge, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ wordBreak: "break-all" }}>{charge.merchant_name}</TableCell>
                  <TableCell>{charge.charge.additional_data?.job_job}</TableCell>
                  <TableCell>{charge.charge.additional_data?.job_collection}</TableCell>
                  <TableCell>{charge.closed ? "Yes" : "No"}</TableCell>
                  <TableCell>C&nbsp;{charge.charge.coins}</TableCell>
                  <TableCell>{charge.charge.username}</TableCell>
                  <TableCell>{toLocalTimeString(charge.charge.timestamp, true, true)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                  No charges
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Paper>
        <Box padding={2}>
          <Typography variant="h4">Storage Charges</Typography>
          <Typography variant="subtitle1">
            Charges for stored data, e.g. Data Manager Datasets and project volumes
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Bytes</TableCell>
              <TableCell>Coins</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storageCharges?.length ? (
              storageCharges.map((charge) => (
                <TableRow key={charge.item_number}>
                  <TableCell>{charge.item_number}</TableCell>
                  <TableCell>{charge.date}</TableCell>
                  {/* TODO: assert additional_data to interface from data-manager-client when it's updated */}
                  <TableCell>{fileSize(charge.additional_data?.peak_bytes)}</TableCell>
                  <TableCell>C&nbsp;{charge.coins}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center" }}>
                  No charges
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Divider sx={{ my: 2 }} />
      <Box textAlign="right">
        <Typography variant="h3">Total Charges</Typography>
        <Typography variant="subtitle1">To be paid by the unit owner</Typography>
        C&nbsp;{chargesData.coins}
      </Box>
    </Container>
  );
};
