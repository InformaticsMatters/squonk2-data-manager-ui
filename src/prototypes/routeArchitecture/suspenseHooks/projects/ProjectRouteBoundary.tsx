import { Component, type ReactNode, Suspense } from "react";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { Loading, NotFound } from "../../PrototypeFrame";

type ErrorBoundaryProps = { children: ReactNode; onReset: () => void };

type ErrorBoundaryState = { error: unknown };

class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  // React and TypeScript lint rules disagree on class-field placement here.
  // eslint-disable-next-line @typescript-eslint/member-ordering
  state: ErrorBoundaryState = { error: null };

  handleReset = () => {
    this.props.onReset();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return <NotFound />;
      }

      return (
        <div role="alert">
          <p>Project route failed.</p>
          <button type="button" onClick={this.handleReset}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ProjectRouteBoundary = ({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string;
}) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <RouteErrorBoundary key={projectId} onReset={reset}>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </RouteErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
