import { fetchPdf } from './fetchPdf';
import { getThumbnail } from './getThumbnail';
import { PdfThumbnails } from '../models/PdfThumbnails';

export async function processUrl(
  url: string,
  db: PdfThumbnails
): Promise<void> {
  return db.exists(url).then(async (exists) => {
    if (exists) {
      return;
    } else {
      return fetchPdf(url)
        .then(getThumbnail)
        .then((thumbnail) => {
          return db.insert(url, thumbnail);
        });
    }
  });
}
