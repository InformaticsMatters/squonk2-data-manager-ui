import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { type z } from "zod/mini";

import { type MotdEntrySchema } from "../pages/api/motd";

type MotdResponse = z.infer<typeof MotdEntrySchema>[];

const fetchMotd = async (): Promise<MotdResponse | null> => {
  const response = await fetch("/api/motd", { cache: "no-store" });

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

export const Motd = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["motd"],
    queryFn: fetchMotd,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  if (isLoading || isError || !data) {
    return null;
  }

  return data.map(({ title, message, url, begin, end }) => (
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
