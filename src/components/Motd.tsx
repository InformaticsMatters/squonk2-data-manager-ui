import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { type z } from "zod/mini";

import { type MotdEntrySchema } from "../pages/api/motd";
import { withBasePath } from "../utils/app/basePath";

type MotdResponse = z.infer<typeof MotdEntrySchema>[];

const fetchMotd = async (): Promise<MotdResponse | null> => {
  const response = await fetch(withBasePath("/api/motd"), { cache: "no-store" });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load MOTD");
  }

  const data = (await response.json()) as MotdResponse;
  return data;
};

function formatDate(dateStr?: string) {
  if (!dateStr) {
    return undefined;
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString();
}

export const motdQueryKey = ["motd"];

/**
 * The messages of the day. Home's server render answers them (`getServerSideProps`), so they are
 * on the first paint rather than inserted above the page once a read lands; this read only keeps
 * them current.
 */
export const Motd = () => {
  const { data } = useSuspenseQuery({
    queryKey: motdQueryKey,
    queryFn: fetchMotd,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return data?.map(({ title, message, url, begin, end }) => (
    <Alert
      action={
        url ? (
          <Button
            color="inherit"
            component="a"
            href={url}
            rel="noopener noreferrer"
            target="_blank"
          >
            More details
          </Button>
        ) : undefined
      }
      key={`${title}-${message}`}
      severity="info"
      sx={{ mb: 2 }}
    >
      <Box>
        {!!title && <AlertTitle sx={{ mb: 0.5 }}>{title}</AlertTitle>}
        <Typography component="div" sx={{ whiteSpace: "pre-line", mb: 1 }}>
          {message}
        </Typography>
        {!!(begin ?? end) && (
          <Typography sx={{ color: "text.secondary" }} variant="caption">
            {!!begin && `From: ${formatDate(begin)} `}
            {!!end && `Until: ${formatDate(end)}`}
          </Typography>
        )}
      </Box>
    </Alert>
  ));
};
