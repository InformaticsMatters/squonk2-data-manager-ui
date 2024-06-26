import { Button, type ButtonProps, Link, type LinkProps } from "@mui/material";
import NextJSLink, { type LinkProps as NextJSLinkProps } from "next/link";

import { HrefButton } from "./HrefButton";

interface NProps<C extends string> {
  href: NextJSLinkProps["href"];
  component: C;
}

type InheritedProps<T> = Omit<T, "component" | "href">;
type LProps = InheritedProps<LinkProps> & NProps<"a">;
type BProps = InheritedProps<ButtonProps> & NProps<"button">;

export type NextLinkProps = BProps | LProps;

// https://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
const regexp = /^(?:[a-z+]+:)?\/\//iu;

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

  // ! Passing href in this way causing prop-types error...
  return component === "a" ? (
    <Link {...(props as InheritedProps<LProps>)} component={NextJSLink} href={href} />
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
