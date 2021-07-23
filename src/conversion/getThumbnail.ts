import pdf from 'pdf-thumbnail';
import { Stream } from 'stream';

/**
 * Convert a Stream to a Buffer, returning a Promise.
 *
 * @param stream - Stream to convert
 * @returns Buffer extracted from the stream
 */
function streamToPromiseBuffer(stream: Stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Extract the thumbnail from the PDF and return it as a base64 string.
 *
 * @param buffer - Buffer containing the PDF data
 * @returns The base 64 string of the thumbnail
 */
export async function getThumbnail(buffer: Buffer): Promise<string> {
  return pdf(buffer, {
    compress: {
      type: 'JPEG',
      quality: 70,
    },
  })
    .then(streamToPromiseBuffer)
    .then((buffer) => {
      if (buffer.length == 0) {
        throw new Error('Failed to extract pdf thumbnail.');
      }

      return buffer.toString('base64');
    });
}
