import {
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetailDefaultProductPrivacy,
} from "@/api/account-server";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { setTimeout as delay } from "node:timers/promises";

import { acceptanceEnvironment } from "../environment";
import { fixtureIds } from "./fixtures";
import { cors, json, readBody, record } from "./http";
import { type ScenarioState } from "./state";

/**
 * The Account Server fixture: organisations, units and their membership, products, and the charge
 * ledgers Administration reads. It answers for the billing ancestry a project or a dataset upload
 * has to establish before it can spend anything.
 */

type UnitFixture = ScenarioState["fixtures"]["units"]["units"][number]["units"][number];

const findUnitGroup = (state: ScenarioState, unitId: string) =>
  state.fixtures.units.units.find((group) => group.units.some((unit) => unit.id === unitId));

const findUnit = (state: ScenarioState, unitId: string): UnitFixture | undefined =>
  findUnitGroup(state, unitId)?.units.find((unit) => unit.id === unitId);

const personalUnitOf = (state: ScenarioState): UnitFixture | undefined =>
  state.fixtures.units.units.find(
    (group) => group.organisation.id === fixtureIds.defaultOrganisation,
  )?.units[0];

const organisationsOf = (state: ScenarioState) => state.fixtures.organisations.organisations;

/**
 * What the Account Server itself declares about a privacy value, restated here from the generated
 * value names rather than imported from the application. This double answers for the server, so its
 * rejection rule stays independent of the rule the screens under test apply.
 */
type FixturePrivacy = UnitAllDetailDefaultProductPrivacy;
const requiresItsPrivacy = (privacy: FixturePrivacy) => privacy.startsWith("ALWAYS_");
const isPrivate = (privacy: FixturePrivacy) => privacy.endsWith("PRIVATE");

/** Both generated patch resources accept the same two fields and leave anything absent alone. */
type ResourcePatchBody = { default_product_privacy?: FixturePrivacy; name?: string };

const readResourcePatch = async (request: IncomingMessage): Promise<ResourcePatchBody> =>
  JSON.parse((await readBody(request)).toString()) as ResourcePatchBody;

const applyResourcePatch = <
  TResource extends { default_product_privacy: FixturePrivacy; name: string },
>(
  resource: TResource,
  body: ResourcePatchBody,
) => {
  resource.name = body.name ?? resource.name;
  resource.default_product_privacy =
    body.default_product_privacy ?? resource.default_product_privacy;
};

/** A single addressed organisation or unit read fails with the body its status describes. */
const addressedReadFailure = (state: ScenarioState, response: ServerResponse) =>
  json(
    response,
    state.addressedReadFailure ?? 503,
    state.addressedReadFailure === 403
      ? state.fixtures.failures.forbidden
      : state.fixtures.failures.serverError,
  );

const changeMembers = (users: { id: string }[], userId: string, add: boolean) => {
  if (add) {
    if (!users.some((user) => user.id === userId)) {
      users.push({ id: userId });
    }
    return users;
  }
  return users.filter((user) => user.id !== userId);
};

/** What the generated product patch accepts, restated here rather than imported. */
type SubscriptionAdjustment = { allowance?: number; limit?: number; name?: string };

type ProductFixture = ProductDmProjectTier | ProductDmStorage;

/** A subscription reports what it was adjusted to, so a read after a change is not the old one. */
const adjustedProduct = (state: ScenarioState, product: ProductFixture): ProductFixture => {
  const adjustment = state.subscriptionAdjustments.get(product.product.id);
  if (!adjustment) {
    return product;
  }
  return {
    ...product,
    coins: {
      ...product.coins,
      allowance: adjustment.allowance ?? product.coins.allowance,
      limit: adjustment.limit ?? product.coins.limit,
    },
    product: { ...product.product, name: adjustment.name ?? product.product.name },
  };
};

/** Every subscription that exists right now, whichever fixture or command produced it. */
const existingProducts = (state: ScenarioState): ProductFixture[] =>
  [
    ...(state.fixtures.products.products as ProductFixture[]),
    ...(state.createdProduct ? [state.createdProduct] : []),
    ...(state.createdStorageProduct ? [state.createdStorageProduct] : []),
  ]
    .filter(({ product }) => !state.deletedSubscriptions.includes(product.id))
    .map((product) => adjustedProduct(state, product));

/**
 * Every subscription addressable by its own resource, which includes the ones the caller's index
 * never lists, so a product readable outside that index is not mistaken for a missing one.
 */
const addressableProducts = (state: ScenarioState): Map<string, ProductFixture> => {
  const unlisted = [
    state.fixtures.screeningProduct,
    state.fixtures.partnerProduct,
    state.fixtures.unlistedProjectProduct,
    state.fixtures.storageProduct,
  ] as ProductFixture[];
  const products = [
    ...unlisted
      .filter(({ product }) => !state.deletedSubscriptions.includes(product.id))
      .map((product) => adjustedProduct(state, product)),
    ...existingProducts(state),
  ];
  return new Map(products.map((product) => [product.product.id, product]));
};

const handleAccountServer = async (request: IncomingMessage, response: ServerResponse) => {
  cors(request, response);
  if (request.method === "OPTIONS") {
    return response.end();
  }
  const url = new URL(request.url ?? "/", acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER);
  const { state } = record(request, url);
  const segments = url.pathname.split("/").filter(Boolean);
  const isWrite = request.method !== "GET";
  if (isWrite && state.accessFailure) {
    await readBody(request);
    return json(
      response,
      state.accessFailure,
      state.accessFailure === 403
        ? state.fixtures.failures.forbidden
        : state.fixtures.failures.serverError,
    );
  }
  if (url.pathname === "/event-stream/version") {
    return json(response, 200, state.fixtures.eventStream);
  }
  if (url.pathname === "/user/account") {
    return state.semanticsFailure
      ? json(response, state.semanticsFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.callerAccount);
  }
  if (url.pathname === "/default/organisation") {
    return state.semanticsFailure
      ? json(response, state.semanticsFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.defaultOrganisation);
  }
  if (url.pathname === "/personal-unit" && request.method === "GET") {
    if (state.semanticsFailure) {
      return json(response, state.semanticsFailure, state.fixtures.failures.serverError);
    }
    const personalUnit = personalUnitOf(state);
    return personalUnit
      ? json(response, 200, personalUnit)
      : json(response, 404, { error: "fixture-personal-unit-not-found" });
  }
  if (url.pathname === "/personal-unit" && request.method === "PUT") {
    await readBody(request);
    if (personalUnitOf(state)) {
      return json(response, 409, { error: "fixture-personal-unit-exists" });
    }
    const personalUnit = state.fixtures.personalUnit;
    state.fixtures.units.units.push({
      count: 1,
      organisation: state.fixtures.defaultOrganisationDetail,
      units: [personalUnit],
    });
    return json(response, 201, {
      id: personalUnit.id,
      organisation_id: fixtureIds.defaultOrganisation,
    });
  }
  if (url.pathname === "/personal-unit" && request.method === "DELETE") {
    state.fixtures.units.units = state.fixtures.units.units.filter(
      (group) => group.organisation.id !== fixtureIds.defaultOrganisation,
    );
    return json(response, 204, undefined);
  }
  if (url.pathname === "/organisation" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)).toString()) as {
      name: string;
      owner: string;
    };
    organisationsOf(state).push({
      caller_is_member: true,
      created: state.fixtures.organisation.created,
      default_product_privacy: "DEFAULT_PRIVATE",
      id: fixtureIds.createdOrganisation,
      name: body.name,
      owner_id: body.owner,
      private: true,
      users: [],
    });
    return json(response, 201, { id: fixtureIds.createdOrganisation });
  }
  if (url.pathname === "/organisation") {
    return json(response, 200, state.fixtures.organisations);
  }
  if (segments[0] === "organisation" && segments[2] === "unit" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)).toString()) as { name: string };
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    const created: UnitFixture = {
      billing_day: 1,
      caller_is_member: true,
      created: organisation.created,
      default_product_privacy: "DEFAULT_PRIVATE",
      id: fixtureIds.createdUnit,
      name: body.name,
      owner_id: state.fixtures.subject,
      private: true,
      users: [{ id: state.fixtures.subject }],
    };
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === organisation.id,
    );
    group
      ? group.units.push(created)
      : state.fixtures.units.units.push({ count: 1, organisation, units: [created] });
    return json(response, 201, { id: created.id });
  }
  if (segments[0] === "organisation" && segments[2] === "unit") {
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === segments[1],
    );
    if (group) {
      return json(response, 200, group);
    }
    // An organisation that holds no unit answers with none of them, because having no unit is not
    // a failure to read one. Only an organisation that does not exist is absent.
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    return organisation
      ? json(response, 200, { count: 0, organisation, units: [] })
      : json(response, 404, { error: "fixture-organisation-not-found" });
  }
  if (segments[0] === "organisation" && segments[2] === "user" && segments.length === 4) {
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    organisation.users = changeMembers(
      organisation.users,
      decodeURIComponent(segments[3]),
      request.method === "PUT",
    );
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments[2] === "user" && segments.length === 4) {
    const unit = findUnit(state, segments[1]);
    if (!unit) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    unit.users = changeMembers(
      unit.users,
      decodeURIComponent(segments[3]),
      request.method === "PUT",
    );
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "PATCH") {
    const body = await readResourcePatch(request);
    const unit = findUnit(state, segments[1]);
    if (!unit) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    // The Account Server accepts a unit privacy only while it does not conflict with its
    // organisation's, so a requiring organisation rejects the opposite visibility outright.
    const organisation = findUnitGroup(state, segments[1])?.organisation;
    if (
      body.default_product_privacy &&
      organisation &&
      requiresItsPrivacy(organisation.default_product_privacy) &&
      isPrivate(organisation.default_product_privacy) !== isPrivate(body.default_product_privacy)
    ) {
      return json(response, 409, {
        error: "The unit privacy conflicts with its organisation's value",
      });
    }
    applyResourcePatch(unit, body);
    return json(response, 200, {});
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "DELETE") {
    const group = findUnitGroup(state, segments[1]);
    if (!group) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    group.units = group.units.filter((unit) => unit.id !== segments[1]);
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "GET") {
    if (state.addressedReadFailure) {
      return addressedReadFailure(state, response);
    }
    // The unlisted unit answers for itself while `/unit` never groups it, so a direct link to a
    // readable resource outside the caller's index is not the same as an absent resource.
    const unit =
      segments[1] === fixtureIds.unlistedUnit
        ? state.fixtures.unlistedUnit
        : findUnit(state, segments[1]);
    return unit
      ? json(response, 200, unit)
      : json(response, 404, { error: "fixture-unit-not-found" });
  }
  if (segments[0] === "organisation" && segments.length === 2 && request.method === "PATCH") {
    const body = await readResourcePatch(request);
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    applyResourcePatch(organisation, body);
    // Units answer with the organisation they are grouped under, so the ancestry a unit inherits
    // stays the same object the organisation resource itself reports.
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === organisation.id,
    );
    if (group) {
      group.organisation = organisation;
    }
    return json(response, 200, {});
  }
  if (segments[0] === "organisation" && segments.length === 2) {
    if (state.addressedReadFailure) {
      return addressedReadFailure(state, response);
    }
    const organisation =
      segments[1] === fixtureIds.unlistedOrganisation
        ? state.fixtures.unlistedOrganisation
        : organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    return organisation
      ? json(response, 200, organisation)
      : json(response, 404, { error: "fixture-organisation-not-found" });
  }
  if (url.pathname === `/charges/organisation/${fixtureIds.organisation}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.organisationCharges);
  }
  if (url.pathname === `/charges/unit/${fixtureIds.unit}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.unitCharges);
  }
  if (url.pathname === `/charges/product/${fixtureIds.product}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.productCharges);
  }
  if (url.pathname === "/unit") {
    return state.unitsReadFailure
      ? json(response, state.unitsReadFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.units);
  }
  if (url.pathname === "/product") {
    if (state.productFailure) {
      return json(response, 503, state.fixtures.failures.serverError);
    }
    const products = existingProducts(state);
    return json(response, 200, { count: products.length, products });
  }
  if (url.pathname === "/product-type") {
    return json(response, 200, {
      count: 3,
      product_types: ["EVALUATION", "BRONZE", "SILVER"].map((flavour) => ({
        flavour,
        type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      })),
    });
  }
  // A unit's own subscriptions. A unit the fixture never subscribed answers with an empty
  // collection rather than an error, because having no subscription is not a failure to read one.
  if (segments[0] === "product" && segments[1] === "unit" && segments.length === 3) {
    if (state.productFailure) {
      return json(response, 503, state.fixtures.failures.serverError);
    }
    if (request.method === "POST") {
      const body = JSON.parse((await readBody(request)).toString()) as {
        allowance?: number;
        flavour?: "BRONZE" | "EVALUATION" | "GOLD" | "SILVER";
        limit?: number;
        name?: string;
        type?: string;
      };
      // A storage subscription is the one Subscriptions itself creates; a project tier is created
      // by the project-creation workflow, and the two are told apart by the type they ask for.
      if (body.type === "DATA_MANAGER_STORAGE_SUBSCRIPTION") {
        if (state.subscriptionMutationFailure) {
          return json(
            response,
            state.subscriptionMutationFailure,
            state.fixtures.failures.serverError,
          );
        }
        const storageUnit = state.fixtures.units.units
          .flatMap(({ units }) => units)
          .find(({ id }) => id === segments[2]);
        if (!storageUnit) {
          return json(response, 404, { error: "fixture-unit-not-found" });
        }
        const storageBase = state.fixtures.storageProduct as ProductDmStorage;
        state.createdStorageProduct = {
          ...storageBase,
          coins: {
            ...storageBase.coins,
            allowance: body.allowance ?? storageBase.coins.allowance,
            limit: body.limit ?? body.allowance ?? storageBase.coins.limit,
          },
          product: {
            ...storageBase.product,
            id: fixtureIds.createdStorageProduct,
            name: body.name,
          },
          unit: storageUnit,
        };
        return json(response, 201, { id: fixtureIds.createdStorageProduct });
      }
      if (state.productCreationFailure) {
        return json(
          response,
          state.productCreationFailure,
          state.productCreationFailure === 400
            ? { error: "fixture-product-domain-failure" }
            : state.fixtures.failures.serverError,
        );
      }
      if (state.productCreationDelay) {
        await delay(state.productCreationDelay);
      }
      const base = state.fixtures.products.products[0] as ProductDmProjectTier;
      const unit = state.fixtures.units.units
        .flatMap(({ units }) => units)
        .find(({ id }) => id === segments[2]);
      if (!unit) {
        return json(response, 404, { error: "fixture-unit-not-found" });
      }
      state.createdProduct = {
        ...base,
        claim: undefined,
        product: {
          ...base.product,
          flavour: body.flavour ?? "BRONZE",
          id: fixtureIds.createdProduct,
          name: body.name,
          type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
        },
        unit,
      };
      return json(response, 201, { id: fixtureIds.createdProduct });
    }
    const listed = state.fixtures.unitProducts[segments[2]] ?? { count: 0, products: [] };
    const products = [
      ...listed.products,
      ...(state.createdProduct?.unit.id === segments[2] ? [state.createdProduct] : []),
      ...(state.createdStorageProduct?.unit.id === segments[2]
        ? [state.createdStorageProduct]
        : []),
    ];
    return json(response, 200, { count: products.length, products });
  }
  // The subscription the project-creation workflow owns keeps its own cleanup behaviour, which is
  // the one deletion that is not a Subscriptions command.
  if (url.pathname === `/product/${fixtureIds.createdProduct}` && state.createdProduct) {
    if (request.method === "DELETE") {
      if (state.cleanupFailure) {
        return json(response, state.cleanupFailure, state.fixtures.failures.serverError);
      }
      state.createdProduct = undefined;
      return json(response, 204, undefined);
    }
    return json(response, 200, { product: state.createdProduct });
  }
  // Every other subscription answers for itself, and for the adjustment and deletion it was asked
  // for, so what one command changed is what every later read of it reports.
  if (segments[0] === "product" && segments.length === 2) {
    const productId = segments[1];
    const product = addressableProducts(state).get(productId);
    if (!product) {
      return json(response, 404, { error: "as-product-not-found", productId });
    }
    const changes = request.method === "PATCH" || request.method === "DELETE";
    if (changes && state.subscriptionMutationFailure) {
      return json(response, state.subscriptionMutationFailure, state.fixtures.failures.serverError);
    }
    if (request.method === "DELETE") {
      state.deletedSubscriptions.push(productId);
      return json(response, 204, undefined);
    }
    if (request.method === "PATCH") {
      const body = JSON.parse((await readBody(request)).toString()) as SubscriptionAdjustment;
      state.subscriptionAdjustments.set(productId, {
        ...state.subscriptionAdjustments.get(productId),
        ...body,
      });
      return json(response, 200, { id: productId });
    }
    return json(response, 200, { product });
  }
  if (url.pathname === "/version") {
    return json(response, 200, state.fixtures.accountServerVersion);
  }
  return json(response, 404, { error: "as-route-not-found", path: url.pathname });
};
export const accountServer = createServer(
  (request, response) => void handleAccountServer(request, response),
);
