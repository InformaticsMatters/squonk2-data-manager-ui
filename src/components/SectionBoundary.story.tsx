import { Alert, Button } from "@mui/material";
import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";

import { AppScaffold } from "../stories/decorators";
import { SectionBoundary } from "./SectionBoundary";
import { ListingSkeleton } from "./skeletons";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

/** The section's one read, answered by hand so a test decides when and how its data arrives. */
let settle: (answer: "answer" | "refuse") => void = () => undefined;
const read = () =>
  new Promise<string>((resolve, reject) => {
    settle = (answer) =>
      answer === "answer" ? resolve("The section's content") : reject(new Error("Refused"));
  });

const Content = () => {
  const { data } = useSuspenseQuery({ queryKey: ["section"], queryFn: read });
  return <p>{data}</p>;
};

/**
 * One section behind its boundary, whose single read waits until "Answer" or "Refuse" is pressed.
 */
export const Section = () => (
  <AppScaffold>
    <QueryClientProvider client={client}>
      <Button onClick={() => settle("answer")}>Answer</Button>
      <Button onClick={() => settle("refuse")}>Refuse</Button>
      <SectionBoundary
        failure={({ retry }) => (
          <Alert action={<Button onClick={retry}>Retry</Button>} severity="error">
            The section is unavailable
          </Alert>
        )}
        skeleton={<ListingSkeleton columns={["Name", "Size"]} />}
      >
        <Content />
      </SectionBoundary>
    </QueryClientProvider>
  </AppScaffold>
);
