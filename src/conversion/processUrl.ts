import { fetchPdf } from './fetchPdf';
import { getThumbnail } from './getThumbnail';
import { PdfThumbnails } from '../models/PdfThumbnails';

export async function processUrl(
  url: string,
  db: PdfThumbnails
): Promise<void> {
  return db.exists(url).then(async (exists) => {
    if (exists) {
      console.log('Url already exists. Nothing to process.');
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
