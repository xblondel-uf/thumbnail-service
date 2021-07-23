import request from 'supertest';
import { Server } from 'http';
import { HookData } from '../webhook/postHook';

process.env.DB_PATH = ':memory:';
const PORT = 7999;

import setup from '../app';
import { Thumbnail } from '../models/PdfThumbnails';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('index', () => {
  let server: Server | null = null;
  let hookData: HookData | null = null;

  beforeAll(async () => {
    const app = await setup();

    /**
     * Route that is passed to the service to download the PDF.
     * :fileName is the name of the PDF file without extension
     * :id is only used to have different urls for the same file
     */
    app.get('/pdf/sample/:id/:fileName', async (req: any, res: any) => {
      const fileName = req.params.fileName;
      const file = `${__dirname}/${fileName}.pdf`;
      res.download(file);
    });

    hookData = null;
    app.post('/hook', async (req: any, res: any) => {
      hookData = req.body;
      res.status(200).json({});
    });

    server = app.listen(PORT, () => {
      console.log(`Test server listening on port ${PORT}`);
    });
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('should upload a document, call the hook and retrieve the document', async () => {
    const url1 = `http://localhost:${PORT}/pdf/sample/1/fixture`;

    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url1, hook: `http://localhost:${PORT}/hook` })
      .expect(200);

    await sleep(2000);

    expect(hookData).not.toBeNull();
    if (hookData != null) {
      expect(hookData.url).toBe(url1);
      expect(hookData.ok).toBe(true);
      expect(hookData.statusText).toBe('');
    }

    await request(server)
      .get('/1/pdf/thumbnails')
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBe(1);
        const thumbnail: Thumbnail = res.body[0];
        expect(thumbnail.url).toBe(url1);
        expect(thumbnail.thumbnail.length).not.toBe(0);
      });
  });
});
