import { type NextApiHandler } from "next";

import { readApiServers } from "../../../application/apiServers";

// Answers the browser's one question about this deployment: where its APIs are. Read from the
// environment on every request, because the image carries no answer of its own.
const handler: NextApiHandler = (req, res) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(readApiServers(process.env));
  } else {
    res.status(405).end("Method not allowed");
  }
};

export default handler;
