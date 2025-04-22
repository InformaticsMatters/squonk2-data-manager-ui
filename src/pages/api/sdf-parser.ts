import {
  filterRecord,
  type FilterRule,
  NodeSDFTransformer,
  type SDFRecord,
} from "@squonk/sdf-parser/node";

import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { type NextApiRequest, type NextApiResponse } from "next";
import { Transform } from "node:stream";
import { createGunzip } from "node:zlib";
import fetch, { type Response } from "node-fetch";

import { type SDFViewerConfig, uncensorConfig } from "../../utils/api/sdfViewer";
import { type JSON_SCHEMA_TYPE } from "../../utils/app/jsonSchema";
import { API_ROUTES } from "../../utils/app/routes";

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
  const { method } = req;
  if (method === "GET") {
    const { project: projectId, path, file: fileName, config: configString } = req.query;

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

      const headers = new Headers({ Authorization: `Bearer ${accessToken}` });

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

export default withApiAuthRequired(handler);
