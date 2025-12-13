import { Alert, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

type MotdResponse = { message: string };

const fetchMotd = async (): Promise<string | null> => {
  const response = await fetch("/api/motd", { cache: "no-store" });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load MOTD");
  }

  const data = (await response.json()) as MotdResponse;
  return data.message;
};

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

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography component="div" sx={{ whiteSpace: "pre-line" }}>
        {data}
      </Typography>
    </Alert>
  );
};
