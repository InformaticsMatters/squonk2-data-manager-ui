import { Component, type ReactNode } from "react";

/** A caught error, and whether it was the read's own failure once that was decided. */
type CaughtFailure = { error: unknown; isReadFailure?: boolean };

/**
 * Catches a failed suspense read without reporting it. A refusal is an ordinary outcome, such as a
 * public project's product read by a non-member, so it is not handed to Sentry as a crash.
 *
 * Everything beneath the read renders inside this boundary, so only the read's own failure is
 * caught; anything else is rethrown to the boundaries above. That is decided once, when it is first
 * caught, because a later retry of the read clears the error it is compared with.
 */
export class ReadFailureBoundary extends Component<
  {
    children: ReactNode;
    fallback: (error: unknown) => ReactNode;
    isReadFailure: (error: unknown) => boolean;
  },
  { failure?: CaughtFailure }
> {
  // eslint-disable-next-line react/sort-comp -- member-ordering wants fields first, and they conflict.
  state: { failure?: CaughtFailure } = {};

  static getDerivedStateFromError = (error: unknown) => ({ failure: { error } });

  render() {
    const { failure } = this.state;
    if (!failure) {
      return this.props.children;
    }
    failure.isReadFailure ??= this.props.isReadFailure(failure.error);
    if (!failure.isReadFailure) {
      throw failure.error;
    }
    return this.props.fallback(failure.error);
  }
}
