import zlib from 'zlib';

import { getAccessToken } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import type { Transform } from 'stream';

import { FixedSizeStreamTransform } from './FixedSizeStreamTransform';
import { handleApiError } from './handleApiError';
import { BadRequestError, InternalServerError } from './HttpError';

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
  const fileSizeLimitNumber = fileSizeLimit as unknown as number;
  const sizeInBytes = fileSizeLimitNumber * 1000;
  // Validate that `sizeInBytes` is a safe integer - no other number rounds to it
  if (isNaN(fileSizeLimitNumber) || !Number.isSafeInteger(sizeInBytes) || fileSizeLimitNumber < 1) {
    throw new BadRequestError(`Invalid limit number '${fileSizeLimit}'`);
  }

  return new FixedSizeStreamTransform(sizeInBytes);
};

const restreamFilePipeline = (
  source: NodeJS.ReadableStream,
  transforms: Transform[],
  destination: NodeJS.WritableStream,
) => {
  let pipe = source;
  for (let i = 0; i < transforms.length; i++) {
    const transform = transforms[i];
    pipe = pipe.pipe(transform);
  }
  pipe.pipe(destination);
};

/**
 * Restreams download from DM API and potentially decompresses it or limits the size of transfer
 * on the fly. The restreaming consists of a source stream, a destination stream and a couple of
 * optional transforms. The source stream is the response from DM API, the output stream is the
 * response returned back to a client. The potential transforms take care of decompressing and
 * limiting the size of the returned response. The source is stream is piped through transforms
 * (if there are any) and then to the output stream. The piping process uses a custom built pipeline
 * instead of a built-in `stream.pipeline` method. The main reason for this is that in case an error
 * occurs anywhere in the pipeline, `stream.pipeline` would close every element in the pipeline.
 * That results in closing the `res` object without actually sending anything to the client (the
 * client receives an empty response). Another reason is that it can't distinguish where in the
 * pipeline an error occurs. This way we could only forward the error message. which is oftentimes
 * not very user friendly, to the client. This implementation attaches an error handler to every
 * element (apart from the `res` object itself) whose responsibility is to call `handleApiError`
 * with an instance of an `HttpError` error with a user friendly message. `handleApiError` will then
 * handle sending the error message with the appropriate status code to the client.
 */
export const restreamDownload = async (
  endpoint: string,
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const { decompress, fileSizeLimit } = req.query;

  try {
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

    response.body.on('error', (error) => {
      handleApiError(
        res,
        new InternalServerError(`There was an error while downloading the requested file.`, error),
      );
    });

    const transforms: Transform[] = [];

    // Decompression has priority since `fileSizeLimit` should be applied to the client's response
    if (decompress) {
      const decompressStream = createDecompressTransform(decompress);

      decompressStream.on('error', (error) => {
        handleApiError(
          res,
          new InternalServerError(`Can't decompress file using '${decompress}' algorithm.`, error),
        );
      });

      transforms.push(decompressStream);
    }

    if (fileSizeLimit) {
      const fixedSizeStreamTransform = createFixedSizeStreamTransform(fileSizeLimit);

      fixedSizeStreamTransform.on('error', (error) => {
        handleApiError(
          res,
          new InternalServerError(
            `There was an error while downloading the requested file.`,
            error,
          ),
        );
      });

      transforms.push(fixedSizeStreamTransform);
    }

    restreamFilePipeline(response.body, transforms, res);
  } catch (error) {
    handleApiError(res, error);
  }
};
