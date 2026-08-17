import {
  filterRecord,
  type FilterRule,
  NodeSDFTransformer,
  type SDFRecord,
} from "@squonk/sdf-parser/node";

import { fromNodeHeaders } from "better-auth/node";
import { type NextApiRequest, type NextApiResponse } from "next";
import { Transform } from "node:stream";
import { createGunzip } from "node:zlib";
import fetch, { type Response } from "node-fetch";

import { auth } from "../../lib/auth";
import { isCompressedFileName } from "../../projects/fileViewers";
import { projectFileResourcePath, readProjectFileAddress } from "../../projects/routes";
import { type SDFViewerConfig, uncensorConfig } from "../../utils/api/sdfViewer";
import { type JSON_SCHEMA_TYPE } from "../../utils/app/jsonSchema";

const getTreatAs = (dtype: JSON_SCHEMA_TYPE): FilterRule["treatAs"] => {
  switch (dtype) {
    case "number":
    case "integer":
      return "number";
    default:
      return "string";
  }
};

type ResponseData = SDFRecord[] | { error: string };

const handler = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { method } = req;
  if (method === "GET") {
    const { project: projectId, path, config: configString } = req.query;

    if (typeof configString !== "string") {
      res.status(400).json({ error: "config must be a string" });
      return;
    }

    let config: SDFViewerConfig;
    try {
      config = uncensorConfig(configString);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "config must be a valid JSON string" });
      return;
    }

    // The file is addressed exactly as the route that asked for it is: one project, one canonical
    // path. Anything else names no file this client can address and is refused rather than guessed
    // at.
    const address = readProjectFileAddress(projectId, path);
    if (address === null) {
      res.status(400).json({ error: "Bad request" });
      return;
    }
    const { file } = address;

    let response: Response;
    try {
      const result = await auth.api.getAccessToken({
        body: { providerId: "keycloak" },
        headers: fromNodeHeaders(req.headers),
      });
      const accessToken = result.accessToken;
      if (!accessToken) {
        res.status(500).json({ error: "No access token" });
        return;
      }

      const headers = new Headers({ Authorization: `Bearer ${accessToken}` });

      response = await fetch(
        process.env.DATA_MANAGER_API_SERVER + projectFileResourcePath(address.projectId, file.path),
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

      if (isCompressedFileName(file.name)) {
        stream = stream.pipe(createGunzip());
      }

      const decoder = new TextDecoder();
      const decoderTransform = new Transform({
        transform(chunk, _encoding, callback) {
          // Decode the incoming chunk from bytes to text
          const decodedChunk = decoder.decode(chunk, { stream: true });
          this.push(decodedChunk);
          callback();
        },
      });

      const rules: FilterRule[] = Object.entries(config).map(([property, { min, max, dtype }]) => ({
        property,
        min,
        max,
        treatAs: getTreatAs(dtype),
      }));

      const excludedProperties = Object.entries(config)
        .filter(([, { include }]) => !include)
        .map(([property]) => property);

      const filter = (record: SDFRecord): boolean => filterRecord(record, rules);

      stream
        .pipe(decoderTransform)
        .pipe(new NodeSDFTransformer(filter, excludedProperties))
        .pipe(res);
      return;
    }
    res.status(response.status).json({ error: response.statusText });
    return;
  }
  res.status(405).json({ error: `Method ${method} Not Allowed` });
};

export default handler;
