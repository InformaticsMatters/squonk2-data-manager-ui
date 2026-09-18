import theme from "@squonk/mui-theme";

import { type Page } from "@playwright/test";

/**
 * The colour a Material UI link takes, in the notation a computed style reports it in.
 *
 * The theme declares its palette in whatever notation it likes and browsers normalise on read, so
 * the browser under test is asked what the token computes to rather than this file predicting the
 * form. A palette change therefore moves the expectation with it, and a link the application never
 * styled still fails against the browser's own default.
 */
export const linkColour = (page: Page) =>
  page.evaluate((declared) => {
    const probe = document.createElement("span");
    probe.style.color = declared;
    document.body.append(probe);
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  }, theme.palette.primary.main);
