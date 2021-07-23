import request from 'supertest';
import { Server } from 'http';
import { HookData } from '../webhook/postHook';
import fs from 'fs/promises';

process.env.DB_PATH = ':memory:';
const PORT = 7999;

import setup from '../app';
import { Thumbnail } from '../models/PdfThumbnails';
import path from 'path/posix';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
  timeout: number,
  check: { (): boolean }
): Promise<boolean> {
  let total = 0;
  const quantum = 10;
  let checked = check();
  while (!checked && total < timeout) {
    await sleep(quantum);
    total += quantum;
    checked = check();
  }
  return checked;
}

describe('index', () => {
  let server: Server | null = null;
  let hookData: HookData | null = null;
  let hookCount = 0;

  beforeEach(async () => {
    const app = await setup();

    /**
     * Route that is passed to the service to download the PDF.
     * :fileName is the name of the PDF file without extension
     * :id is only used to have different urls for the same file
     */
    app.get('/pdf/sample/:id/:fileName', async (req: any, res: any) => {
      const fileName = req.params.fileName;
      const file = `${__dirname}/fixtures/${fileName}.pdf`;
      const exists = await fs
        .access(file)
        .then(() => true)
        .catch((err) => false);
      if (exists) {
        res.status(200).download(file);
      } else {
        res.status(404).json({});
      }
    });

    hookData = null;
    hookCount = 0;
    app.post('/hook', async (req: any, res: any) => {
      hookData = req.body;
      res.status(200).json({});
      hookCount += 1;
    });

    server = app.listen(PORT, () => {
      console.log(`Test server listening on port ${PORT}`);
    });
  });

  afterEach(async () => {
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

    await waitFor(2000, () => hookData != null);

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

  it('should upload an invalid document, call the hook with an error and not retrieve the document', async () => {
    const url1 = `http://localhost:${PORT}/pdf/sample/1/not_a_pdf`;

    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url1, hook: `http://localhost:${PORT}/hook` })
      .expect(200);

    await waitFor(2000, () => hookData != null);

    expect(hookData).not.toBeNull();
    if (hookData != null) {
      expect(hookData.url).toBe(url1);
      expect(hookData.ok).toBe(false);
      expect(hookData.statusText).toBe(
        'Error: Failed to extract pdf thumbnail.'
      );
    }

    await request(server)
      .get('/1/pdf/thumbnails')
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBe(0);
      });
  });

  it('should upload a non-existent document, call the hook with an error and not retrieve the document', async () => {
    const url1 = `http://localhost:${PORT}/pdf/sample/1/does_not_exist`;

    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url1, hook: `http://localhost:${PORT}/hook` })
      .expect(200);

    await waitFor(2000, () => hookData != null);

    expect(hookData).not.toBeNull();
    if (hookData != null) {
      expect(hookData.url).toBe(url1);
      expect(hookData.ok).toBe(false);
      expect(hookData.statusText).toBe('Error: Not Found');
    }

    await request(server)
      .get('/1/pdf/thumbnails')
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBe(0);
      });
  });

  it('should upload multiple documents, and paginate the results', async () => {
    const url1 = `http://localhost:${PORT}/pdf/sample/1/fixture`;
    const url2 = `http://localhost:${PORT}/pdf/sample/2/fixture`;
    const url3 = `http://localhost:${PORT}/pdf/sample/3/fixture`;
    const url4 = `http://localhost:${PORT}/pdf/sample/4/fixture`;
    const url5 = `http://localhost:${PORT}/pdf/sample/5/fixture`;

    expect(hookCount).toBe(0);

    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url1, hook: `http://localhost:${PORT}/hook` })
      .expect(200);
    await sleep(2);
    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url2, hook: `http://localhost:${PORT}/hook` })
      .expect(200);
    await sleep(2);
    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url3, hook: `http://localhost:${PORT}/hook` })
      .expect(200);
    await sleep(2);
    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url4, hook: `http://localhost:${PORT}/hook` })
      .expect(200);
    await sleep(2);
    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: url5, hook: `http://localhost:${PORT}/hook` })
      .expect(200);

    await waitFor(2000, () => hookCount == 5);

    // no pagination
    await request(server)
      .get('/1/pdf/thumbnails')
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBe(5);
        const expected = [url5, url4, url3, url2, url1];
        const actual = (res.body as Thumbnail[]).map((tn) => tn.url);
        expect(actual).toEqual(expected);
      });
  });
});
