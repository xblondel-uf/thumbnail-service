import { PdfThumbnails } from "../PdfThumbnails";

describe('PdfThumbnails', () => {
    async function getInstance() {
        const target = new PdfThumbnails(':memory:');
        await target.setup();
        return target;
    }
    it('should create an empty table', async () => {
        const target = await getInstance();

        const actual = await target.fetch();
        expect(actual.length).toBe(0);
    });
});