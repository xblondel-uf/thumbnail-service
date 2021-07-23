import { fetchPdf } from './fetchPdf';
import { getThumbnail } from './getThumbnail';
import { PdfThumbnails } from '../models/PdfThumbnails';

/**
 * Process a PDF url: Fetch the PDF, extract the thumbnail and store it to the database.
 *
 * @param url - PDF url to process
 * @param db - Database model
 * @returns Nothing
 */
export async function processUrl(
  url: string,
  db: PdfThumbnails
): Promise<void> {
  return db.exists(url).then(async (exists) => {
    if (exists) {
      console.debug('Url already exists. Nothing to process.');
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
