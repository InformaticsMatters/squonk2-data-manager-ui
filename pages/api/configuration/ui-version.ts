import { type NextApiHandler } from "next";

const handler: NextApiHandler = (req, res) => {
  if (req.method === "GET") {
    res.status(200).send(process.env.NEXT_PUBLIC_APP_VERSION);
  } else {
    res.status(405).end("Method not allowed");
  }
};

export default handler;
