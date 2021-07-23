import pdf from 'pdf-thumbnail';
import { Stream } from 'stream';
import { isCaseOrDefaultClause } from 'typescript';

function streamToPromiseBuffer(stream: Stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

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
