import {
  type QueryKey,
  useQuery,
  useQueryClient,
  useQueryErrorResetBoundary,
  type UseQueryResult,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";

/**
 * How long a read that has just settled counts as fresh, as `useSuspenseQuery` sets it: the read
 * that suspended is not repeated the moment the component it suspended mounts.
 */
const MIN_SUSPENSE_TIME_MS = 1000;

const clampStaleTime = <TValue extends number | "static" | undefined>(value: TValue) =>
  value === "static" ? value : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS);

/** A read that has answered, with data or with the failure it answered with. */
export type SettledQueryResult<TData, TError> = Exclude<
  UseQueryResult<TData, TError>,
  { status: "pending" }
>;

/**
 * Suspends until one read settles, as a suspense read does, and then hands back whatever it settled
 * on — failure included — rather than throwing it.
 *
 * A suspense read throws every failure, and React logs every error a boundary catches. A refusal is
 * an ordinary answer, not a crash, so catching it in a boundary filled the console with errors and
 * the Next.js development overlay with "unhandled" runtime errors for pages that were working.
 * `throwOnError` keeps the failures that are still worth throwing, which reach the boundaries above
 * as they would from a suspense read.
 *
 * A read that settled on a failure it keeps is not read again merely for having mounted: that
 * failure is the answer, and it stays observed, so a later refetch of it is still seen in place. A
 * thrown failure is read again once its boundary resets, and suspends while it is.
 */
export const useSettledQuery = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  throwOnError: (error: TError) => boolean = () => false,
): SettledQueryResult<TData, TError> => {
  const queryClient = useQueryClient();
  const { staleTime } = queryClient.defaultQueryOptions(options);
  const read = {
    ...options,
    staleTime:
      typeof staleTime === "function"
        ? (...args: Parameters<typeof staleTime>) => clampStaleTime(staleTime(...args))
        : clampStaleTime(staleTime),
  };
  const errorResetBoundary = useQueryErrorResetBoundary();
  const failure = queryClient.getQueryState(options.queryKey)?.error as TError | null | undefined;
  const settledOnFailure = failure !== null && failure !== undefined && !throwOnError(failure);
  const query = useQuery({ ...read, retryOnMount: !settledOnFailure, throwOnError });

  if (query.isPending || (query.isFetching && query.data === undefined && !settledOnFailure)) {
    // Suspends on the fetch already in flight, exactly as a suspense read does. Its failure is
    // caught here so it is not thrown: once it settles, the read renders or throws it.
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- this is how a read suspends.
    throw queryClient.fetchQuery(read).catch(() => errorResetBoundary.clearReset());
  }
  return query;
};
