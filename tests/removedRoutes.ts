/**
 * Every route the redesign removed, spelled the way a bookmark or an old link would spell it, and
 * paired with the identity its query string used to carry where it carried one.
 *
 * The cutover is clean, so one list serves both proofs: the pure contract matrix requires every
 * family parser to answer `not-found` for each of these, and the production-build journey requires
 * the application to answer each with its ordinary not-found at the URL it was asked for. Spelling
 * the set once is what stops those two guarantees covering different routes.
 */
export const removedRoutePaths = ({
  dataset,
  instance,
  organisation,
  product,
  project,
  task,
  unit,
  workflow,
}: {
  dataset: string;
  instance: string;
  organisation: string;
  product: string;
  project: string;
  task: string;
  unit: string;
  workflow: string;
}): readonly string[] => [
  "project",
  `project?project=${project}`,
  "project/file",
  `project/file?project=${project}&file=%2Finputs%2Fposes.sdf`,
  "run",
  `run?project=${project}`,
  "results",
  `results?project=${project}`,
  `results/instance/${instance}`,
  `results/task/${task}`,
  `results/workflow/${workflow}`,
  `dataset/${dataset}/1`,
  "products",
  `product/${product}/charges`,
  `unit/${unit}/charges`,
  `unit/${unit}/inventory`,
  `organisation/${organisation}/inventory`,
  "viewer/sdf",
  // The Administration restructure removed every one of its own URLs too, including the task
  // landings whose segments were merely renamed. The cutover stays clean: no redirect, no query
  // translation, no compatibility alias — an old bookmark is an ordinary not-found.
  "administration/organisation-access",
  `administration/organisation-access/organisations/${organisation}`,
  `administration/organisation-access/units/${unit}`,
  "administration/subscriptions",
  "administration/usage-inventory",
  `administration/usage-inventory/organisations/${organisation}`,
  `administration/usage-inventory/units/${unit}`,
  "administration/charges/organisations",
  `administration/charges/organisations/${organisation}`,
  `administration/charges/units/${unit}`,
  `administration/charges/products/${product}`,
];
