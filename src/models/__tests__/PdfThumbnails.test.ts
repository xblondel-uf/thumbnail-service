import { PdfThumbnails, Thumbnail } from '../PdfThumbnails';

describe('PdfThumbnails', () => {
  async function getInstance() {
    const target = new PdfThumbnails(':memory:');
    await target.setup();
    return target;
  }

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  it('should create an empty table', async () => {
    const target = await getInstance();

    const actual = await target.fetch();
    expect(actual).toEqual([]);
  });

  it('should insert data and fetch it back', async () => {
    const target = await getInstance();

    const url1 = 'url1';
    const thumbnail1 = 'thumbnail1';
    await target.insert(url1, thumbnail1);

    const actual = await target.fetch();
    expect(actual.length).toEqual(1);
    expect(actual[0].url).toEqual(url1);
    expect(actual[0].thumbnail).toEqual(thumbnail1);

    const exists = await target.exists(url1);
    expect(exists).toBe(true);
  });

  it('should insert data and fetch it back most recent first', async () => {
    const target = await getInstance();

    const url1 = 'url1';
    const thumbnail1 = 'thumbnail1';
    await target.insert(url1, thumbnail1);

    // to avoid having two insertions in the same milliseconds
    // which is our datetime resolution
    await sleep(2);

    const url2 = 'url2';
    const thumbnail2 = 'thumbnail2';
    await target.insert(url2, thumbnail2);

    const actual = await target.fetch();
    expect(actual.length).toEqual(2);
    expect(actual[0].url).toEqual(url2);
    expect(actual[0].thumbnail).toEqual(thumbnail2);
    expect(actual[1].url).toEqual(url1);
    expect(actual[1].thumbnail).toEqual(thumbnail1);
  });

  it('should ignore duplicate insertions', async () => {
    const target = await getInstance();

    const url1 = 'url1';
    const thumbnail1 = 'thumbnail1';
    await target.insert(url1, thumbnail1);
    // this second insertion should be ignored
    await target.insert(url1, thumbnail1);

    // we should only fetch a single element
    const actual = await target.fetch();
    expect(actual.length).toEqual(1);
    expect(actual[0].url).toEqual(url1);
    expect(actual[0].thumbnail).toEqual(thumbnail1);
  });

  it('should insert data and fetch it back with pagination, most recent first', async () => {
    const target = await getInstance();

    const url1 = 'url1';
    const thumbnail1 = 'thumbnail1';
    await target.insert(url1, thumbnail1);
    await sleep(2);
    const url2 = 'url2';
    const thumbnail2 = 'thumbnail2';
    await target.insert(url2, thumbnail2);
    await sleep(2);
    const url3 = 'url3';
    const thumbnail3 = 'thumbnail3';
    await target.insert(url3, thumbnail3);
    await sleep(2);
    const url4 = 'url4';
    const thumbnail4 = 'thumbnail4';
    await target.insert(url4, thumbnail4);
    await sleep(2);
    const url5 = 'url5';
    const thumbnail5 = 'thumbnail5';
    await target.insert(url5, thumbnail5);

    // first three (in reverse order)
    const actual1 = await target.fetch(0, 3);
    expect(actual1.length).toEqual(3);
    expect(actual1[0].url).toEqual(url5);
    expect(actual1[0].thumbnail).toEqual(thumbnail5);
    expect(actual1[1].url).toEqual(url4);
    expect(actual1[1].thumbnail).toEqual(thumbnail4);
    expect(actual1[2].url).toEqual(url3);
    expect(actual1[2].thumbnail).toEqual(thumbnail3);

    // last two (in reverse order, and even though we ask for three)
    const actual2 = await target.fetch(3, 3);
    expect(actual2.length).toEqual(2);
    expect(actual2[0].url).toEqual(url2);
    expect(actual2[0].thumbnail).toEqual(thumbnail2);
    expect(actual2[1].url).toEqual(url1);
    expect(actual2[1].thumbnail).toEqual(thumbnail1);
  });
});
