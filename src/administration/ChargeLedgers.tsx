import { type ChangeEvent } from "react";

import { type ChargeSummary } from "@/api/account-server";
import {
  useGetOrganisationChargesSuspense,
  useGetProductChargesSuspense,
  useGetUnitChargesSuspense,
} from "@/api/account-server/charges";
import { useGetProductsSuspense } from "@/api/account-server/product";
import { useGetUnitsSuspense } from "@/api/account-server/unit";

import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";

import { isProductId, isUnitId } from "../routing/identifiers";
import { withBasePath } from "../utils/app/basePath";
import { formatCoins } from "../utils/app/coins";
import { administrationLinks, type ChargeResourceRoute } from "./routes";

const chargeFor = (summary: ChargeSummary[], type: ChargeSummary["type"]) =>
  summary.find((charge) => charge.type === type)?.coins ?? "0";

const chargeRequest = { timeout: 30_000 };

const BillingCycleSelect = ({ route }: { route: ChargeResourceRoute }) => {
  const router = useRouter();
  const changeCycle = (event: ChangeEvent<HTMLInputElement> | { target: { value: unknown } }) => {
    const billingCycle = Number(event.target.value);
    void router.push(
      administrationLinks.chargeResource(route.collection, route.resourceId, {
        billingCycle,
      }) as never,
    );
  };

  return (
    <FormControl size="small" sx={{ minWidth: 240 }}>
      <InputLabel id="billing-cycle-label">Billing cycle</InputLabel>
      <Select
        label="Billing cycle"
        labelId="billing-cycle-label"
        value={route.state.billingCycle}
        onChange={changeCycle}
      >
        {Array.from({ length: 24 }, (_, index) => -index).map((billingCycle) => (
          <MenuItem key={billingCycle} value={billingCycle}>
            {billingCycle === 0
              ? "Current billing cycle"
              : `${Math.abs(billingCycle)} billing cycle${billingCycle === -1 ? "" : "s"} ago`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const LedgerHeader = ({
  ancestry,
  id,
  name,
  period,
  route,
  type,
}: {
  ancestry?: string;
  id: string;
  name: string;
  period?: string;
  route: ChargeResourceRoute;
  type: string;
}) => (
  <Stack spacing={1.5} sx={{ mb: 3 }}>
    <Typography component="h2" variant="h4">
      {type} ledger
    </Typography>
    <Box>
      <Typography component="h3" variant="h5">
        {name}
      </Typography>
      {ancestry ? <Typography color="text.secondary">{ancestry}</Typography> : null}
      <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="caption">
        {id}
      </Typography>
    </Box>
    <Alert severity="info">This charge ledger is read-only.</Alert>
    <Box>
      <Typography component="h4" sx={{ mb: 1 }} variant="h6">
        Billing period
      </Typography>
      <BillingCycleSelect route={route} />
      {period ? (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {period}
        </Typography>
      ) : null}
    </Box>
  </Stack>
);

const ChargesTable = ({
  empty,
  rows,
}: {
  empty: string;
  rows: { href?: string; id: string; name: string; processing: string; storage: string }[];
}) => (
  <Paper variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Resource</TableCell>
          <TableCell align="right">Storage</TableCell>
          <TableCell align="right">Processing</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} sx={{ textAlign: "center" }}>
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {row.href ? <Link href={withBasePath(row.href)}>{row.name}</Link> : row.name}
                <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
                  {row.id}
                </Typography>
              </TableCell>
              <TableCell align="right">{formatCoins(row.storage)}</TableCell>
              <TableCell align="right">{formatCoins(row.processing)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </Paper>
);

const Total = ({ coins }: { coins: string }) => (
  <Typography sx={{ mt: 2, textAlign: "right" }} variant="h5">
    Total charges: {formatCoins(coins)}
  </Typography>
);

const OrganisationLedger = ({ route }: { route: ChargeResourceRoute }) => {
  const { data } = useGetOrganisationChargesSuspense(
    route.resourceId,
    { pbp: route.state.billingCycle },
    { request: chargeRequest },
  );

  return (
    <>
      <LedgerHeader id={data.organisation_id} name={data.name} route={route} type="Organisation" />
      <ChargesTable
        empty="No unit charges were recorded for this billing cycle."
        rows={data.unit_charges.map((unit) => ({
          href: isUnitId(unit.unit_id)
            ? administrationLinks.chargeResource("units", unit.unit_id, route.state)
            : undefined,
          id: unit.unit_id,
          name: unit.name,
          processing: chargeFor(unit.summary, "PROCESSING"),
          storage: chargeFor(unit.summary, "STORAGE"),
        }))}
      />
      <Total coins={data.coins} />
    </>
  );
};

const UnitLedger = ({ route }: { route: ChargeResourceRoute }) => {
  const { data: groups } = useGetUnitsSuspense();
  const match = groups.units
    .flatMap(({ organisation, units }) => units.map((unit) => ({ organisation, unit })))
    .find(({ unit }) => unit.id === route.resourceId);
  const { data } = useGetUnitChargesSuspense(
    route.resourceId,
    { pbp: route.state.billingCycle },
    { request: chargeRequest },
  );

  return (
    <>
      <LedgerHeader
        ancestry={match?.organisation.name}
        id={data.unit_id}
        name={data.name ?? match?.unit.name ?? "Unit"}
        period={`${data.from} to ${data.until}`}
        route={route}
        type="Unit"
      />
      <ChargesTable
        empty="No product charges were recorded for this billing cycle."
        rows={data.products.map((product) => ({
          href: isProductId(product.product_id)
            ? administrationLinks.chargeResource("products", product.product_id, route.state)
            : undefined,
          id: product.product_id,
          name: product.product_type.replaceAll("_", " ").toLowerCase(),
          processing: chargeFor(product.charges, "PROCESSING"),
          storage: chargeFor(product.charges, "STORAGE"),
        }))}
      />
      <Total coins={data.coins} />
    </>
  );
};

const ProductLedger = ({ route }: { route: ChargeResourceRoute }) => {
  const { data: products } = useGetProductsSuspense();
  const product = products.products.find((candidate) => candidate.product.id === route.resourceId);
  const { data } = useGetProductChargesSuspense(
    route.resourceId,
    { pbp: route.state.billingCycle },
    { request: chargeRequest },
  );
  const processing = data.processing_charges.map((charge, index) => ({
    id: `${charge.merchant_name}-${index}`,
    name: charge.merchant_name,
    processing: charge.charge.coins,
    storage: "0",
  }));
  const storage = data.storage_charges.items.map((charge) => ({
    id: String(charge.item_number),
    name: charge.date,
    processing: "0",
    storage: charge.coins,
  }));

  return (
    <>
      <LedgerHeader
        ancestry={product ? `${product.organisation.name} / ${product.unit.name}` : undefined}
        id={data.product_id}
        name={product?.product.name ?? "Subscription"}
        period={`${data.from} to ${data.until}`}
        route={route}
        type="Product"
      />
      <ChargesTable
        empty="No charges were recorded for this billing cycle."
        rows={[...processing, ...storage]}
      />
      <Total coins={data.coins} />
    </>
  );
};

export const ChargeLedger = ({ route }: { route: ChargeResourceRoute }) => {
  if (route.collection === "organisations") {
    return <OrganisationLedger route={route} />;
  }
  if (route.collection === "units") {
    return <UnitLedger route={route} />;
  }
  return <ProductLedger route={route} />;
};
