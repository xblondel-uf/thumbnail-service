import { PdfThumbnails } from '../../models/PdfThumbnails'

const fetchPdfMock = jest.fn();

jest.mock('../fetchPdf.ts', () => {
    return {
        fetchPdf: fetchPdfMock,
    }
});

const getThumbnailMock = jest.fn();

jest.mock('../getThumbnail.ts', () => {
    return {
        getThumbnail: getThumbnailMock,
    }
});

import { processUrl } from '../processUrl';

describe('processUrl', () => {
    beforeEach(() => {
        fetchPdfMock.mockClear();
        getThumbnailMock.mockClear();
    });

    it('should succesfully process the url', async () => {
        const data = 'data1';
        const url = 'url1';

        const db = new PdfThumbnails(':memory:');
        await db.setup();

        fetchPdfMock.mockResolvedValueOnce(Buffer.from(data, 'utf-8'));
        getThumbnailMock.mockImplementationOnce(async (buffer) => {
            return buffer.toString('base64')
        });

        await processUrl(url, db);

        const expected = Buffer.from(data, 'utf-8').toString('base64');
        const actual = await db.fetch();

        expect(actual.length).toBe(1);
        expect(actual[0].thumbnail).toBe(expected);
        expect(fetchPdfMock).toHaveBeenCalled();
        expect(getThumbnailMock).toHaveBeenCalled();
    });
});