import fetch, { Response } from 'node-fetch';

/**
 * Check the status of the fetch response.
 *
 * @param res - Response to check
 * @returns The received response, throw if the response has an error status.
 */
function checkStatus(res: Response) {
  if (res.ok) {
    return res;
  } else {
    throw Error(res.statusText);
  }
}

/**
 * Fetch a PDF from a URL.
 *
 * @param url - url to fetch the pdf from
 * @returns PDF data as a Buffer
 */
export async function fetchPdf(url: string): Promise<Buffer> {
  return fetch(url)
    .then(checkStatus)
    .then((res) => res.buffer());
}
