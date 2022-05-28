const VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL;

/**
 * This redirects the user to the correct Vercel url.
 *
 * Vercel allows the deployment to be accessed
 * via multiple URLs. Due to the way `next-auth` works, it only works on ONE. This redirects to
 * the correct one.
 */
export const vercelRedirect = () => {
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    typeof window !== 'undefined' &&
    VERCEL_URL &&
    !window.location.toString().includes(VERCEL_URL)
  ) {
    window.location.href = `http://${VERCEL_URL}`;
  }
};
