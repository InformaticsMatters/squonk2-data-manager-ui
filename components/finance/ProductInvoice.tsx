import type { ProductDetail } from "@squonk/account-server-client";
import { useGetProduct, useGetProductCharges } from "@squonk/account-server-client/product";

import {
  Box,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { toLocalTimeString } from "../../utils/app/datetime";
import { LogoImage } from "../logo/LogoImage";

export interface ProductInvoiceProps {
  productId: ProductDetail["id"];
}

export const ProductInvoice = ({ productId }: ProductInvoiceProps) => {
  const { data: chargesData } = useGetProductCharges(productId);

  const processingCharges = chargesData?.processing_charges;
  const storageCharges = chargesData?.storage_charges.items;

  const { data: productData } = useGetProduct(productId);

  const isPrint = useMediaQuery("print");

  return (
    <Container maxWidth="md">
      <Grid container>
        <Grid item xs={6}>
          <Box marginBottom={4}>
            <Typography variant="h1">Invoice</Typography>
            Informatics Matters LTD
            <br />
            <Link href="mailto:info@informaticsmatters.com">info@informaticsmatters.com</Link>
          </Box>

          <Box>
            <Typography variant="h3">Billed To</Typography>
            <em>{productData?.product.unit.name}</em> a member of the{" "}
            <em>{productData?.product.organisation.name}</em> organisation
          </Box>
        </Grid>
        <Grid item textAlign="right" xs={6}>
          <LogoImage variant={isPrint ? "light" : undefined} />
        </Grid>
      </Grid>

      <Grid container sx={{ my: 4 }}>
        <Grid item xs={4}>
          <Typography gutterBottom variant="h3">
            Organisation: {productData?.product.organisation.name}
          </Typography>
          <Typography gutterBottom variant="h4">
            Billing period
          </Typography>
          {chargesData?.from} to {chargesData?.until}
        </Grid>
        <Grid item xs={8}>
          <Paper>
            <Typography sx={{ mx: 1, paddingTop: 2 }} variant="h4">
              Processing Charges
            </Typography>
            <Table size="small" sx={{ marginBottom: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Merchant</TableCell>
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
                      <TableCell>{charge.closed ? "Yes" : "No"}</TableCell>
                      <TableCell>C&nbsp;{charge.charge.coins}</TableCell>
                      <TableCell>{charge.charge.username}</TableCell>
                      <TableCell>
                        {toLocalTimeString(charge.charge.timestamp, true, true)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center" }}>
                      No charges
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
          <Paper>
            <Typography sx={{ mx: 1, paddingTop: 2 }} variant="h4">
              Storage Charges
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Coins</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storageCharges?.length ? (
                  storageCharges.map((charge) => (
                    <TableRow key={charge.item_number}>
                      <TableCell>{charge.item_number}</TableCell>
                      <TableCell>{charge.date}</TableCell>
                      <TableCell>C&nbsp;{charge.coins}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: "center" }}>
                      No charges
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
          <Divider sx={{ my: 2 }} />
          <Box textAlign="right">
            <Typography variant="h3">Invoice Total</Typography>
            C&nbsp;{chargesData?.coins}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
