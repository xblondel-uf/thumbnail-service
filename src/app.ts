import express from 'express';
import { PdfThumbnails } from './models/PdfThumbnails';
import { processUrl } from './conversion/processUrl';
import { postHook } from './webhook/postHook';

/**
 * Create and setup the application.
 *
 * @param dbPath - Path of the sqlite database file
 * @returns Created application
 */
export default async function setup(dbPath: string): Promise<express.Express> {
  const db = new PdfThumbnails(dbPath);
  await db.setup();

  const app = express();
  app.use(express.json());

  const router = express.Router();

  router.post('/pdf/upload', async (req: any, res: any) => {
    const url = req.body.url;
    const hook = req.body.hook;

    processUrl(url, db)
      .then(() => {
        console.debug(`Url [${url || '(null)'}] succesfully processed`);
        postHook(hook, url, true);
      })
      .catch((err) => {
        console.error(`Failed to process url [${url || '(null)'}]: ${err}`);
        postHook(hook, url, false, `${err}`);
      });

    res.status(200).json({});
  });

  router.get('/pdf/thumbnails', async (req: any, res: any) => {
    const from = parseInt(req.query.from || '0', 10);
    const size = parseInt(req.query.size || '0', 10);
    if (from < 0 || size < 0) {
      // Unprocessable entity
      return res.status(422).json({});
    }
    const data = await db.fetch(from, size);

    console.debug(`Returning ${data.length} elements`);

    return res.status(200).json(data);
  });

  app.use('/1', router);

  return app;
}
