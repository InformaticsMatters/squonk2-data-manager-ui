import { type ReactNode } from "react";

import { type AppProps } from "next/app";

import { createPageComposition } from "./PageCompositions";
import { type PagePolicy } from "./pagePolicy";

export const PagePolicyComposer = ({
  children,
  policy,
}: {
  children: ReactNode;
  policy: PagePolicy;
}) => createPageComposition(policy, children);

export type PolicyAppComponent = AppProps["Component"] & { pagePolicy: PagePolicy };
