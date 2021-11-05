import { Transform } from 'stream';

import type { TransformCallback, TransformOptions } from 'stream';

/**
 * Limits the size of a stream to specified number in bytes. It counts the number of sent bytes.
 * In case the size of a chunk to be sent is larger than the remaining bytes to be sent, it slices
 * the chunk to be the same length as the remaining bytes.
 */
export class FixedSizeStreamTransform extends Transform {
  private bytesSent: number;

  constructor(private size: number, options?: TransformOptions) {
    super(options);
    this.bytesSent = 0;
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.bytesSent + chunk.length > this.size) {
      const sizeToSend = this.size - this.bytesSent;

      this.push(chunk.slice(0, sizeToSend));
      this.bytesSent += sizeToSend;

      this.end();
    } else {
      this.push(chunk);
      this.bytesSent += chunk.length;
    }

    callback();
  }
}
