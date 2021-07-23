import * as dotenv from 'dotenv';
import express from 'express';
import { PdfThumbnails } from './models/PdfThumbnails';
import { processUrl } from './conversion/processUrl';

export default async function setup(): Promise<express.Express> {
  dotenv.config();

  if (!process.env.PORT) {
    console.error('The PORT environment variable must be defined');
    process.exit(1);
  }
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

    processUrl(url, db)
      .then(() => {
        console.log(`Url [${url || '(null)'}] succesfully processed`);
      })
      .catch((err) => {
        console.error(`Failed to process url [${url || '(null)'}]: ${err}`);
      });

    res.status(200).json({});
  });

  router.get('/pdf/thumbnails', async (req: any, res: any) => {
    const data = await db.fetch();

    return res.status(200).json(data);
  });

  app.use('/1', router);

  return app;
}
