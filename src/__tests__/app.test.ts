import request from 'supertest';
import { Server } from 'http';

process.env.DB_PATH = ':memory:';
const PORT = 7999;

import setup from '../app';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('index', () => {
  let server: Server | null = null;

  beforeAll(async () => {
    const app = await setup();
    app.get('/pdf/sample/:id', async (req: any, res: any) => {
      const file = `${__dirname}/fixture.pdf`;
      res.download(file);
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
  it('should upload a document', async () => {
    await request(server)
      .post('/1/pdf/upload/')
      .send({ url: `http://localhost:${PORT}/pdf/sample/1` })
      .expect(200);

    await sleep(2000);
    await request(server)
      .get('/1/pdf/thumbnails')
      .expect(200)
      .then((res) => {
        expect(res.body.length).toBe(1);
      });
  });
});
