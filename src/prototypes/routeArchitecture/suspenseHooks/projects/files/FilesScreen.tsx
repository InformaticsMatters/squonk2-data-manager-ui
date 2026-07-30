import {
  useRefreshSuspenseProjectRoute,
  useSuspenseProjectRoute,
} from "../useSuspenseProjectRoute";

export const FilesScreen = ({ projectId }: { projectId: string }) => {
  const route = useSuspenseProjectRoute(projectId);
  const refresh = useRefreshSuspenseProjectRoute(projectId, route.product.product.id);
  const handleRefresh = () => void refresh();

  return (
    <>
      <section>
        <h3>Files</h3>
        <button disabled={!route.capabilities.canEditFiles} type="button">
          Upload file
        </button>{" "}
        <button type="button" onClick={handleRefresh}>
          Background refresh
        </button>
        <p>Capability: {route.capabilities.canEditFiles ? "can edit files" : "read only"}</p>
        <p>Query activity: {route.isFetching ? "refreshing cached content" : "settled"}</p>
        <small>Files independently called useSuspenseProjectRoute.</small>
      </section>
      <section>
        <h3>Practical observations</h3>
        <ul>
          <li>Generated suspense hooks give both consumers non-optional data.</li>
          <li>React Query deduplicates their identical generated query keys.</li>
          <li>Project then Product is necessarily a serial Suspense waterfall.</li>
          <li>Background invalidation keeps stale content visible without showing the fallback.</li>
          <li>The family boundary, not each consumer, maps 404 and owns reset behavior.</li>
        </ul>
      </section>
    </>
  );
};
