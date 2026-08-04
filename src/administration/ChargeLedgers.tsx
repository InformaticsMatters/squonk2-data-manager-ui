import { type ChangeEvent } from "react";

import {
  type ChargeSummary,
  type ProcessingCharges,
  type StorageChargeItem,
  type UnitProductChargeSummary,
} from "@/api/account-server";
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
import { filesize } from "filesize";
import { useRouter } from "next/router";

import { isProductId, isUnitId } from "../routing/identifiers";
import { withBasePath } from "../utils/app/basePath";
import { formatCoins } from "../utils/app/coins";
import { toLocalTimeString } from "../utils/app/datetime";
import { formatOrdinals } from "../utils/app/ordinals";
import { administrationLinks, type ChargeResourceRoute } from "./routes";

const chargeFor = (summary: ChargeSummary[], type: ChargeSummary["type"]) =>
  summary.find((charge) => charge.type === type)?.coins ?? "0";

const chargeRequest = { timeout: 30_000 };

const productTypes: Record<UnitProductChargeSummary["product_type"], string> = {
  DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION: "Project Subscription",
  DATA_MANAGER_STORAGE_SUBSCRIPTION: "Dataset Subscription",
};

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
  <Box sx={{ mt: 2, textAlign: "right" }}>
    <Typography variant="h5">Total charges: {formatCoins(coins)}</Typography>
  </Box>
);

const ProductChargesTables = ({
  processing,
  storage,
}: {
  processing: ProcessingCharges[];
  storage: StorageChargeItem[];
}) => (
  <Stack spacing={2}>
    <Paper variant="outlined">
      <Box sx={{ p: 2 }}>
        <Typography component="h3" variant="h5">
          Processing charges
        </Typography>
        <Typography color="text.secondary">
          Charges from computations, such as running Data Manager jobs.
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Merchant</TableCell>
            <TableCell>Job</TableCell>
            <TableCell>Job collection</TableCell>
            <TableCell>Closed</TableCell>
            <TableCell align="right">Coins</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processing.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                No processing charges were recorded for this billing cycle.
              </TableCell>
            </TableRow>
          ) : (
            processing.map((charge) => (
              <TableRow key={`${charge.merchant_api_hostname}-${charge.charge.id}`}>
                <TableCell sx={{ wordBreak: "break-all" }}>{charge.merchant_name}</TableCell>
                <TableCell>
                  {(charge.charge.additional_data?.job_job as string | undefined) ?? ""}
                </TableCell>
                <TableCell>
                  {(charge.charge.additional_data?.job_collection as string | undefined) ?? ""}
                </TableCell>
                <TableCell>{charge.closed ? "Yes" : "No"}</TableCell>
                <TableCell align="right">{formatCoins(charge.charge.coins)}</TableCell>
                <TableCell>{charge.charge.username}</TableCell>
                <TableCell>{toLocalTimeString(charge.charge.timestamp, true, true)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
    <Paper variant="outlined">
      <Box sx={{ p: 2 }}>
        <Typography component="h3" variant="h5">
          Storage charges
        </Typography>
        <Typography color="text.secondary">
          Charges for stored data, such as Data Manager datasets and project volumes.
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Bytes</TableCell>
            <TableCell align="right">Coins</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {storage.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} sx={{ textAlign: "center" }}>
                No storage charges were recorded for this billing cycle.
              </TableCell>
            </TableRow>
          ) : (
            storage.map((charge) => (
              <TableRow key={charge.item_number}>
                <TableCell>{charge.item_number}</TableCell>
                <TableCell>{charge.date}</TableCell>
                <TableCell>
                  {filesize(Number(charge.additional_data?.peak_bytes ?? 0), { standard: "si" })}
                </TableCell>
                <TableCell align="right">{formatCoins(charge.coins)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  </Stack>
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
      <Typography sx={{ mb: 2 }}>
        <strong>Billed to:</strong> unit <em>{data.name ?? match?.unit.name ?? "Unit"}</em>
        {data.owner_id ? ` (owner: ${data.owner_id})` : null}
      </Typography>
      <ChargesTable
        empty="No product charges were recorded for this billing cycle."
        rows={data.products.map((product) => ({
          href: isProductId(product.product_id)
            ? administrationLinks.chargeResource("products", product.product_id, route.state)
            : undefined,
          id: product.product_id,
          name: productTypes[product.product_type],
          processing: chargeFor(product.charges, "PROCESSING"),
          storage: chargeFor(product.charges, "STORAGE"),
        }))}
      />
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Typography>
          Processing subtotal: {formatCoins(chargeFor(data.summary.charges, "PROCESSING"))}
        </Typography>
        <Typography>
          Storage subtotal: {formatCoins(chargeFor(data.summary.charges, "STORAGE"))}
        </Typography>
        <Typography color="text.secondary">To be paid by the unit owner</Typography>
      </Box>
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

  return (
    <>
      <LedgerHeader
        ancestry={product ? `${product.organisation.name} / ${product.unit.name}` : undefined}
        id={data.product_id}
        name={product?.product.name ?? "Subscription"}
        period={`${data.from} to ${data.until}${product ? ` (billed on the ${formatOrdinals(product.unit.billing_day)} of the month)` : ""}`}
        route={route}
        type="Product"
      />
      {product ? (
        <Typography sx={{ mb: 2 }}>
          <strong>Billed to:</strong> unit <em>{product.unit.name}</em> belonging to the{" "}
          <em>{product.organisation.name}</em> organisation
        </Typography>
      ) : null}
      <ProductChargesTables
        processing={data.processing_charges}
        storage={data.storage_charges.items}
      />
      <Typography color="text.secondary" sx={{ mt: 2, textAlign: "right" }}>
        To be paid by the unit owner
      </Typography>
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
