import { useEffect, useState } from "react";

import { Container } from "@mui/material";

// {
//   "id": 1,
//   "read_token": "gsrPDunJnCvm3gZJzUa92Z"
// }

export const Configuration = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    new EventSource("/api/as-api/event-stream/1").onmessage = (event) => {
      setMessage(event.data);
      console.log(event);
    };
  });

  return (
    <Container>
      <h1>Event Stream</h1>
      {message}
    </Container>
  );
};

export default Configuration;
