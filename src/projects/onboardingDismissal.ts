/**
 * That the caller has put the onboarding offer away.
 *
 * Account-scoped and durable, so it lives in `localStorage` and is taken by the logout cleanup —
 * unlike the project-creation recovery record beside it, which describes one in-flight attempt and
 * lives in `sessionStorage`. It addresses no resource, so it is never a scope a later visit is
 * resolved against; it only decides whether an offer is shown again.
 */
export const PROJECT_ONBOARDING_DISMISSAL_KEY = "data-manager-ui-project-onboarding-dismissed";

const dismissedValue = "1";

export const projectOnboardingIsDismissed = (storage: Pick<Storage, "getItem">) => {
  try {
    return storage.getItem(PROJECT_ONBOARDING_DISMISSAL_KEY) === dismissedValue;
  } catch {
    return false;
  }
};

export const dismissProjectOnboarding = (storage: Pick<Storage, "setItem">) => {
  try {
    storage.setItem(PROJECT_ONBOARDING_DISMISSAL_KEY, dismissedValue);
  } catch {
    // A browser that refuses to remember the dismissal still lets the caller put the panel away for
    // this visit; nothing else depends on the write having happened.
  }
};
