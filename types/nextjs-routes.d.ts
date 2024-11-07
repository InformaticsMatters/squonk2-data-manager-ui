// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// This file will be automatically regenerated when your Next.js server is running.
// nextjs-routes version: 2.2.2
/* eslint-disable */

// prettier-ignore
declare module "nextjs-routes" {
  import type {
    GetServerSidePropsContext as NextGetServerSidePropsContext,
    GetServerSidePropsResult as NextGetServerSidePropsResult
  } from "next";

  export type Route =
    | StaticRoute<"/">
    | DynamicRoute<"/api/as-api/[...asProxy]", { "asProxy": string[] }>
    | DynamicRoute<"/api/auth/[auth0]", { "auth0": string }>
    | StaticRoute<"/api/configuration/ui-version">
    | DynamicRoute<"/api/dm-api/[...dmProxy]", { "dmProxy": string[] }>
    | StaticRoute<"/api/sdf-parser">
    | DynamicRoute<"/api/viewer-proxy/[...viewerProxy]", { "viewerProxy": string[] }>
    | StaticRoute<"/configuration">
    | DynamicRoute<"/dataset/[datasetId]/[datasetVersion]", { "datasetId": string; "datasetVersion": string }>
    | StaticRoute<"/datasets">
    | StaticRoute<"/docs/concepts">
    | StaticRoute<"/docs/developer">
    | StaticRoute<"/docs/guided-tour">
    | StaticRoute<"/docs/how-to">
    | StaticRoute<"/docs/how-to/applications">
    | StaticRoute<"/docs/how-to/context">
    | StaticRoute<"/docs/how-to/create-project">
    | StaticRoute<"/docs/how-to/execution">
    | StaticRoute<"/docs/how-to/jobs">
    | StaticRoute<"/docs/how-to/login">
    | StaticRoute<"/docs/how-to/projects-tab">
    | StaticRoute<"/docs/how-to/results">
    | StaticRoute<"/docs/how-to/usage-quotas">
    | StaticRoute<"/docs/jobs">
    | DynamicRoute<"/organisation/[organisationId]/inventory", { "organisationId": string }>
    | DynamicRoute<"/product/[productId]/charges", { "productId": string }>
    | StaticRoute<"/products">
    | StaticRoute<"/project">
    | StaticRoute<"/project/file">
    | StaticRoute<"/results">
    | DynamicRoute<"/results/instance/[instanceId]", { "instanceId": string }>
    | DynamicRoute<"/results/task/[taskId]", { "taskId": string }>
    | StaticRoute<"/run">
    | DynamicRoute<"/unit/[unitId]/charges", { "unitId": string }>
    | DynamicRoute<"/unit/[unitId]/inventory", { "unitId": string }>
    | StaticRoute<"/viewer/sdf">;

  interface StaticRoute<Pathname> {
    pathname: Pathname;
    query?: Query | undefined;
    hash?: string | null | undefined;
  }

  interface DynamicRoute<Pathname, Parameters> {
    pathname: Pathname;
    query: Parameters & Query;
    hash?: string | null | undefined;
  }

  interface Query {
    [key: string]: string | string[] | undefined;
  };

  export type RoutedQuery<P extends Route["pathname"] = Route["pathname"]> = Extract<
    Route,
    { pathname: P }
  >["query"];

  export type Locale = undefined;

  type Brand<K, T> = K & { __brand: T };

  /**
   * A string that is a valid application route.
   */
  export type RouteLiteral = Brand<string, "RouteLiteral">

  /**
   * A typesafe utility function for generating paths in your application.
   *
   * route({ pathname: "/foos/[foo]", query: { foo: "bar" }}) will produce "/foos/bar".
   */
  export declare function route(r: Route): RouteLiteral;

  /**
   * Nearly identical to GetServerSidePropsContext from next, but further narrows
   * types based on nextjs-route's route data.
   */
  export type GetServerSidePropsContext<
    Pathname extends Route["pathname"] = Route["pathname"],
    Preview extends NextGetServerSidePropsContext["previewData"] = NextGetServerSidePropsContext["previewData"]
  > = Omit<NextGetServerSidePropsContext, 'params' | 'query' | 'defaultLocale' | 'locale' | 'locales'> & {
    params: Extract<Route, { pathname: Pathname }>["query"];
    query: Query;
    defaultLocale?: undefined;
    locale?: Locale;
    locales?: undefined;
  };

  /**
   * Nearly identical to GetServerSideProps from next, but further narrows
   * types based on nextjs-route's route data.
   */
  export type GetServerSideProps<
    Props extends { [key: string]: any } = { [key: string]: any },
    Pathname extends Route["pathname"] = Route["pathname"],
    Preview extends NextGetServerSideProps["previewData"] = NextGetServerSideProps["previewData"]
  > = (
    context: GetServerSidePropsContext<Pathname, Preview>
  ) => Promise<NextGetServerSidePropsResult<Props>>
}

// prettier-ignore
declare module "next/link" {
  import type { Route } from "nextjs-routes";;
  import type { LinkProps as NextLinkProps } from "next/dist/client/link";
  import type React from "react";

  type StaticRoute = Exclude<Route, { query: any }>["pathname"];

  export type LinkProps = Omit<NextLinkProps, "href" | "locale"> & {
    href: Route | StaticRoute | Omit<Route, "pathname">;
    locale?: false;
  }

  /**
   * A React component that extends the HTML `<a>` element to provide [prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
   * and client-side navigation between routes.
   *
   * It is the primary way to navigate between routes in Next.js.
   *
   * Read more: [Next.js docs: `<Link>`](https://nextjs.org/docs/app/api-reference/components/link)
   */
  declare const Link: React.ForwardRefExoticComponent<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & LinkProps & {
      children?: React.ReactNode;
  } & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

// prettier-ignore
declare module "next/router" {
  import type { Locale, Route, RoutedQuery } from "nextjs-routes";
  import type { NextRouter as Router } from "next/dist/client/router";
  export * from "next/dist/client/router";
  export { default } from "next/dist/client/router";

  type NextTransitionOptions = NonNullable<Parameters<Router["push"]>[2]>;
  type StaticRoute = Exclude<Route, { query: any }>["pathname"];

  interface TransitionOptions extends Omit<NextTransitionOptions, "locale"> {
    locale?: false;
  }

  type PathnameAndQuery<Pathname> = Required<
    Pick<Extract<Route, { pathname: Pathname }>, "pathname" | "query">
  >;

  type AutomaticStaticOptimizedQuery<PaQ> = Omit<PaQ, "query"> & {
    query: Partial<PaQ["query"]>;
  };

  type BaseRouter<PaQ> =
    | ({ isReady: false } & AutomaticStaticOptimizedQuery<PaQ>)
    | ({ isReady: true } & PaQ);

  export type NextRouter<P extends Route["pathname"] = Route["pathname"]> =
    BaseRouter<PathnameAndQuery<P>> &
      Omit<
        Router,
        | "defaultLocale"
        | "domainLocales"
        | "isReady"
        | "locale"
        | "locales"
        | "pathname"
        | "push"
        | "query"
        | "replace"
        | "route"
      > & {
        defaultLocale?: undefined;
        domainLocales?: undefined;
        locale?: Locale;
        locales?: undefined;
        push(
          url: Route | StaticRoute | Omit<Route, "pathname">,
          as?: string,
          options?: TransitionOptions
        ): Promise<boolean>;
        replace(
          url: Route | StaticRoute | Omit<Route, "pathname">,
          as?: string,
          options?: TransitionOptions
        ): Promise<boolean>;
        route: P;
      };

  export function useRouter<P extends Route["pathname"]>(): NextRouter<P>;
}
