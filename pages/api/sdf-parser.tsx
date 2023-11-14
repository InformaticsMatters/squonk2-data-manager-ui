import type { SDFRecord } from "@squonk/sdf-parser";
import { NodeSDFTransformer } from "@squonk/sdf-parser";

import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";
import { Transform } from "node:stream";
import { createGunzip } from "node:zlib";
import fetch, { type Response } from "node-fetch";

import { API_ROUTES } from "../../utils/app/routes";

type ResponseData = SDFRecord[] | { error: string };

const handler = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const { method } = req;
  if (method === "GET") {
    const { project: projectId, path, file: fileName } = req.query;

    if (
      !projectId ||
      !path ||
      !fileName ||
      Array.isArray(projectId) ||
      Array.isArray(path) ||
      Array.isArray(fileName)
    ) {
      res.status(400).json({ error: "Bad request" });
      return;
    }

    let response: Response;
    try {
      const { accessToken } = await getAccessToken(req, res);
      if (!accessToken) {
        res.status(500).json({ error: "No access token" }); // should this be 401?
        return;
      }

      const headers = new Headers({
        Authorization: `Bearer ${accessToken}`,
      });

      fetch(
        process.env.DATA_MANAGER_API_SERVER + API_ROUTES.projectFile(projectId, path, fileName),
        { headers },
      );

      response = await fetch(
        process.env.DATA_MANAGER_API_SERVER + API_ROUTES.projectFile(projectId, path, fileName),
        { headers },
      );
    } catch {
      res.status(500).json({ error: "Network error fetching file" });
      return;
    }

    if (response.ok) {
      let stream = response.body;
      if (!stream) {
        res.status(500).json({ error: "No stream from response" });
        return;
      }

      const compressed = fileName.endsWith(".gz");
      if (compressed) {
        stream = stream.pipe(createGunzip());
      }

      const decoder = new TextDecoder("utf-8");
      const decoderTransform = new Transform({
        transform(chunk, _encoding, callback) {
          // Decode the incoming chunk from bytes to text
          const decodedChunk = decoder.decode(chunk, { stream: true });
          this.push(decodedChunk);
          callback();
        },
      });

      stream.pipe(decoderTransform).pipe(new NodeSDFTransformer()).pipe(res);
      return;
    }
    res.status(response.status).json({ error: response.statusText });
    return;
  }
  res.status(405).json({ error: `Method ${method} Not Allowed` });
};

export default withApiAuthRequired(handler);
