import Head from "next/head";

import { formatPageTitle } from "../application/pageTitle";

/**
 * A page's title, from the parts `formatPageTitle` takes, and its description. Only public pages
 * pass a description. A page rendering this replaces the title its policy gave it in `_app`,
 * because Next keeps the last `<title>` rendered.
 */
export const PageHead = ({
  description,
  parts,
}: {
  description?: string;
  parts: readonly string[];
}) => (
  <Head>
    <title>{formatPageTitle(parts)}</title>
    {description ? <meta content={description} key="description" name="description" /> : null}
  </Head>
);
