import zlib from 'zlib';

import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import fetch from 'node-fetch';
import type { Transform } from 'stream';

const decompressMap: { [index: string]: (() => Transform) | undefined } = {
  inflate: zlib.createInflate,
  gunzip: zlib.createGunzip,
  brotli: zlib.createBrotliDecompress,
  unzip: zlib.createUnzip,
};

export default withApiAuthRequired(async (req, res) => {
  const { fileId, decompress } = req.query;

  try {
    const { accessToken } = await getAccessToken(req, res);

    const response = await fetch(`${process.env.DATA_MANAGER_API_SERVER}/file/${fileId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return res.status(response.status).json(await response.json());
    }

    // In case the body is empty return empty string
    if (!response.body) {
      return res.send('');
    }

    if (decompress) {
      const decompressOption = decompressMap[decompress as string];
      if (!decompressOption) {
        // Keep the shape of the error the same with data-manager-api
        throw { error: `Invalid decompress value '${decompress}'` };
      }

      const decompressStream = decompressOption();
      // If wrong decompression algorithm was provided, zlib will throw an error
      decompressStream.on('error', (error) => {
        console.log(error);
        res.status(500).json({ error: `Can't decompress file using '${decompress}' algorithm.` });
      });

      response.body.pipe(decompressStream).pipe(res);
    } else {
      response.body.pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
