import { pipeline } from 'stream/promises';
import zlib from 'zlib';

import { getAccessToken } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import type { Transform } from 'stream';

import { FixedSizeStreamTransform } from './FixedSizeStreamTransform';
import { BadRequestError } from './HttpError';

const decompressMap: { [index: string]: (() => Transform) | undefined } = {
  inflate: zlib.createInflate,
  gunzip: zlib.createGunzip,
  brotli: zlib.createBrotliDecompress,
  unzip: zlib.createUnzip,
};

const createDecompressTransform = (decompress: string | string[]) => {
  const decompressOption = decompressMap[decompress as string];
  if (!decompressOption) {
    throw new BadRequestError(`Invalid decompress value '${decompress}'`);
  }

  return decompressOption();
};

const createFixedSizeStreamTransform = (fileSizeLimit: string | string[]) => {
  const fileSizeLimitNumber = parseInt(fileSizeLimit as string);
  // Validate that `fileSizeLimitNumber` is a safe integer - no other number rounds to it
  if (
    isNaN(fileSizeLimitNumber) ||
    !Number.isSafeInteger(fileSizeLimitNumber) ||
    fileSizeLimitNumber < 1
  ) {
    throw new BadRequestError(`Invalid limit number '${fileSizeLimit}'`);
  }

  return new FixedSizeStreamTransform(fileSizeLimitNumber);
};

const createPipeline = (
  decompress: string | string[],
  fileSizeLimit: string | string[],
  res: NextApiResponse,
): NodeJS.WritableStream[] => {
  const pipelineElements: NodeJS.WritableStream[] = [];

  // Decompression has priority since `fileSizeLimit` should be applied to the client's response
  if (decompress) {
    pipelineElements.push(createDecompressTransform(decompress));
  }

  if (fileSizeLimit) {
    pipelineElements.push(createFixedSizeStreamTransform(fileSizeLimit));
  }

  pipelineElements.push(res);

  return pipelineElements;
};

/**
 * Restreams download from DM API and potentially decompresses it or limits the size of transfer
 * on the fly. The restreaming consists of a source stream, a destination stream and a couple of
 * optional transforms. The source stream is the response from DM API, the output stream is the
 * response returned back to a client. The potential transforms take care of decompressing and
 * limiting the size of the returned response. The source is stream is piped through transforms
 * (if there are any) and then to the output stream.
 */
export const restreamDownload = async (
  endpoint: string,
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const { decompress, fileSizeLimit } = req.query;

  // Create the pipeline first, otherwise the `fetch` call gets stalled in case of an error
  const pipelineElements = createPipeline(decompress, fileSizeLimit, res);

  const { accessToken } = await getAccessToken(req, res);

  const response = await fetch(`${process.env.DATA_MANAGER_API_SERVER}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return res.status(response.status).json(await response.json());
  }

  // In case the body is empty return empty string
  if (!response.body) {
    return res.send('');
  }

  // The types for pipeline API are just weird
  const [firstPipelineElement, ...restOfPipeline] = pipelineElements;
  await pipeline(response.body, firstPipelineElement, ...restOfPipeline);
};
