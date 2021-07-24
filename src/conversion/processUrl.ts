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
      let pdfContents: string | null = null;
      return fetchPdf(url)
        .then((contents) => {
          pdfContents = contents.toString('base64');
          return contents;
        })
        .then(getThumbnail)
        .then((thumbnail) => {
          if (pdfContents == null) {
            throw new Error('Empty pdf contents');
          }
          return db.insert(url, pdfContents, thumbnail);
        });
    }
  });
}
