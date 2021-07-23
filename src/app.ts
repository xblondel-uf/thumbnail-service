import * as dotenv from 'dotenv';
import express from 'express';
import { PdfThumbnails } from './models/PdfThumbnails';
import { processUrl } from './conversion/processUrl';
import { postHook } from './webhook/postHook';

export default async function setup(): Promise<express.Express> {
  dotenv.config();

  if (!process.env.DB_PATH) {
    console.error('The DB_PATH environment variable must be defined');
    process.exit(1);
  }

  const DB_PATH = process.env.DB_PATH as string;
  const db = new PdfThumbnails(DB_PATH);
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
    const data = await db.fetch(from, size);

    console.debug(`Returning ${data.length} elements`);

    return res.status(200).json(data);
  });

  app.use('/1', router);

  return app;
}
