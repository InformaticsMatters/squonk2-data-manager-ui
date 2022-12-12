import type { ButtonProps, LinkProps } from "@mui/material";
import { Button, Link } from "@mui/material";
import type { LinkProps as NextJSLinkProps } from "next/link";
import NextJSLink from "next/link";
import type { Route } from "nextjs-routes";

import { HrefButton } from "./HrefButton";

interface NProps<C extends string> {
  href: NextJSLinkProps<Route>["href"];
  component: C;
}

type InheritedProps<T> = Omit<T, "href" | "component">;
type LProps = InheritedProps<LinkProps> & NProps<"a">;
type BProps = InheritedProps<ButtonProps> & NProps<"button">;

export type NextLinkProps = LProps | BProps;

// https://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
const regexp = new RegExp("^(?:[a-z+]+:)?//", "i");

/**
 * Generic Link component for all uses.
 *
 * External links are implemented as a MuiLink or MuiButton. Internal Links are the same but using
 * a NextJS Link at the root.
 * Compatible with nextjs-routes to provide route type checking
 */
export const NextLink = ({ href, component = "a", ...props }: NextLinkProps) => {
  // Absolute/External URLs
  if (typeof href === "string" && regexp.test(href)) {
    return component === "a" ? (
      <Link
        {...(props as InheritedProps<LProps>)}
        component="a"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      />
    ) : (
      <HrefButton
        {...(props as InheritedProps<BProps>)}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      />
    );
  }

  // Relative URLs
  return component === "a" ? (
    <Link
      {...(props as InheritedProps<LProps>)}
      component={NextJSLink}
      href={href as unknown as string}
    />
  ) : (
    // MUI doesn't seem to allow a custom component to be passed when you pass it props that should
    // give an anchor link under-the-hood, so we assert to any here
    // The SC suggests this shouldn't causes problems:
    // https://github.com/mui/material-ui/blob/master/packages/mui-base/src/ButtonUnstyled/ButtonUnstyled.tsx
    <Button
      {...(props as InheritedProps<BProps>)}
      component={NextJSLink as any}
      href={href as unknown as string}
    />
  );
};
