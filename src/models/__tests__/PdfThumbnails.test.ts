import { PdfThumbnails, Thumbnail } from "../PdfThumbnails";

describe('PdfThumbnails', () => {
    async function getInstance() {
        const target = new PdfThumbnails(':memory:');
        await target.setup();
        return target;
    }

    async function sleep(ms: number) : Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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

});