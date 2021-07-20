import fetch, { Response } from 'node-fetch';

function checkStatus(res: Response) {
    if (res.ok) {
        return res;
    } else {
        throw Error(res.statusText);
    }
}

export async function fetchPdf(url: string) : Promise<Buffer> {
    return fetch(url)
        .then(checkStatus)
        .then(res => res.buffer());
}