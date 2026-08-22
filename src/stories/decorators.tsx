import { type ReactNode } from "react";

import { ThemeProviders } from "../components/app/ThemeProviders";

export interface AppScaffoldProps {
  children: ReactNode;
}

/**
 * The providers a component needs to render outside the Next application. Stories wrap themselves
 * in this rather than the gallery wrapping every story, so each story states its own scenario and
 * a component that needs no theme can opt out.
 */
export const AppScaffold = ({ children }: AppScaffoldProps) => (
  <ThemeProviders>{children}</ThemeProviders>
);
