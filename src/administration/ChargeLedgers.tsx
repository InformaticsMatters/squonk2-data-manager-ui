import { type ChangeEvent } from "react";

import {
  type ChargeSummary,
  type OrganisationAllDetail,
  type ProcessingCharges,
  type StorageChargeItem,
  type UnitAllDetail,
  type UnitProductChargeSummary,
} from "@/api/account-server";

import {
  Alert,
  Box,
  FormControl,
  InputLabel,
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

import { isProductId } from "../routing/identifiers";
import { formatCoins } from "../utils/app/coins";
import { toLocalTimeString } from "../utils/app/datetime";
import { formatOrdinals } from "../utils/app/ordinals";
import {
  useAddressedOrganisationCharges,
  useAddressedProductCharges,
  useAddressedUnitCharges,
} from "./accessFacts";
import { AddressedResourceView, AdministrationLink, PageTitle, Section } from "./resources";
import { administrationLinks, type AdministrationRoute, type ChargeRouteState } from "./routes";
import { type SubscriptionFacts } from "./subscriptionFacts";

const chargeFor = (summary: ChargeSummary[], type: ChargeSummary["type"]) =>
  summary.find((charge) => charge.type === type)?.coins ?? "0";

const productTypes: Record<UnitProductChargeSummary["product_type"], string> = {
  DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION: "Project Subscription",
  DATA_MANAGER_STORAGE_SUBSCRIPTION: "Dataset Subscription",
};

/**
 * The billing period a ledger reports. The choice is in the URL, so a colleague opening the link
 * sees the same period, and each ledger supplies its own address for it rather than a shared one.
 */
const BillingCycleSelect = ({
  hrefFor,
  state,
}: {
  hrefFor: (billingCycle: number) => string;
  state: ChargeRouteState;
}) => {
  const router = useRouter();
  const changeCycle = (event: ChangeEvent<HTMLInputElement> | { target: { value: unknown } }) => {
    void router.push(hrefFor(Number(event.target.value)) as never);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 240 }}>
      <InputLabel id="billing-cycle-label">Billing cycle</InputLabel>
      <Select
        label="Billing cycle"
        labelId="billing-cycle-label"
        value={state.billingCycle}
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

const BillingPeriod = ({
  hrefFor,
  period,
  state,
}: {
  hrefFor: (billingCycle: number) => string;
  period?: string;
  state: ChargeRouteState;
}) => (
  <Box sx={{ mb: 3 }}>
    <BillingCycleSelect hrefFor={hrefFor} state={state} />
    {period ? (
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {period}
      </Typography>
    ) : null}
  </Box>
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
                {row.href ? (
                  <AdministrationLink href={row.href}>{row.name}</AdministrationLink>
                ) : (
                  row.name
                )}
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

/**
 * The organisation in effect's own ledger, with each of its units linking that unit's ledger. The
 * unit links carry the same billing cycle, so following one keeps the period being compared.
 */
export const OrganisationChargeLedger = ({
  organisationId,
  route,
}: {
  organisationId: string;
  route: Extract<AdministrationRoute, { kind: "organisation-charges" }>;
}) => {
  const addressed = useAddressedOrganisationCharges(organisationId, route.state.billingCycle);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={({ organisation_id }) => organisation_id}
      section="Charges"
      subject="organisation"
    >
      {(data) => (
        <>
          <PageTitle>Charges</PageTitle>
          <Typography
            color="text.secondary"
            sx={{ mb: 2, overflowWrap: "anywhere" }}
            variant="body2"
          >
            {data.name} · {data.organisation_id}
          </Typography>
          <BillingPeriod
            hrefFor={(billingCycle) => administrationLinks.organisationCharges({ billingCycle })}
            state={route.state}
          />
          <ChargesTable
            empty="No unit charges were recorded for this billing cycle."
            rows={data.unit_charges.map((unit) => ({
              href: administrationLinks.unitCharges(unit.unit_id, route.state),
              id: unit.unit_id,
              name: unit.name,
              processing: chargeFor(unit.summary, "PROCESSING"),
              storage: chargeFor(unit.summary, "STORAGE"),
            }))}
          />
          <Total coins={data.coins} />
        </>
      )}
    </AddressedResourceView>
  );
};

/**
 * Why the default organisation has no ledger, for a caller who typed or bookmarked the address.
 * The Account Server refuses organisation charges for it outright, so nothing here is worth
 * retrying — the spend it holds is a unit's, and that is where the caller is sent.
 */
export const DefaultOrganisationCharges = () => (
  <>
    <PageTitle>Charges</PageTitle>
    <Alert severity="info">
      The default organisation has no charge ledger of its own. Its spend belongs to the units
      inside it, so open a unit and read its Charges section.{" "}
      <AdministrationLink href={administrationLinks.overview()}>
        Back to the organisation overview
      </AdministrationLink>
    </Alert>
  </>
);

/** One unit's ledger, and every subscription it paid for, inside the unit workspace. */
export const UnitChargeLedger = ({
  organisation,
  route,
  unit,
}: {
  organisation?: OrganisationAllDetail;
  route: Extract<AdministrationRoute, { kind: "unit-charges" }>;
  unit: UnitAllDetail;
}) => {
  const addressed = useAddressedUnitCharges(route.unitId, route.state.billingCycle);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={({ unit_id }) => unit_id}
      section="Charges"
      subject="unit"
    >
      {(data) => (
        <>
          <BillingPeriod
            hrefFor={(billingCycle) =>
              administrationLinks.unitCharges(route.unitId, { billingCycle })
            }
            period={`${data.from} to ${data.until}`}
            state={route.state}
          />
          <Typography sx={{ mb: 2 }}>
            <strong>Billed to:</strong> unit <em>{data.name ?? unit.name}</em>
            {organisation ? ` of ${organisation.name}` : null}
            {data.owner_id ? ` (owner: ${data.owner_id})` : null}
          </Typography>
          <ChargesTable
            empty="No product charges were recorded for this billing cycle."
            rows={data.products.map((product) => ({
              href: isProductId(product.product_id)
                ? administrationLinks.subscriptionCharges(
                    route.unitId,
                    product.product_id,
                    route.state,
                  )
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
      )}
    </AddressedResourceView>
  );
};

/** One subscription's own ledger, on its own route, so it can be linked to directly. */
export const SubscriptionChargeLedger = ({
  route,
  subscription,
}: {
  route: Extract<AdministrationRoute, { kind: "subscription-charges" }>;
  subscription: SubscriptionFacts;
}) => {
  const addressed = useAddressedProductCharges(route.productId, route.state.billingCycle);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={({ product_id }) => product_id}
      section="Charges"
      subject="subscription"
    >
      {(data) => (
        <Section title="Charges">
          <BillingPeriod
            hrefFor={(billingCycle) =>
              administrationLinks.subscriptionCharges(route.unitId, route.productId, {
                billingCycle,
              })
            }
            period={`${data.from} to ${data.until} (billed on the ${formatOrdinals(
              subscription.billingDay,
            )} of the month)`}
            state={route.state}
          />
          <Typography sx={{ mb: 2 }}>
            <strong>Billed to:</strong> unit <em>{subscription.unit.name}</em> belonging to the{" "}
            <em>{subscription.organisation.name}</em> organisation
          </Typography>
          <ProductChargesTables
            processing={data.processing_charges}
            storage={data.storage_charges.items}
          />
          <Typography color="text.secondary" sx={{ mt: 2, textAlign: "right" }}>
            To be paid by the unit owner
          </Typography>
          <Total coins={data.coins} />
        </Section>
      )}
    </AddressedResourceView>
  );
};
