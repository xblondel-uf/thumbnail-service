# Thumbnail service

## Prerequisites

This service has been developed and tested with node v16.4.2. It has been tested on the following platforms:

- Windows 10 + WSL 2
- macOS Big Sur

To generate the thumbnails, we use the [pdf-thumbnail](https://www.npmjs.com/package/pdf-thumbnail) package, which requires ImageMagick and Ghostscript.

To install them:

- on macOS:

```
$ brew install imagemagick
$ brew install ghostscript
```

- on Linux:

```
$ sudo apt-get install imagemagick
$ sudo apt-get install ghostscript
```

_Caveat_: You may need to authorize ImageMagick to use Ghostscript. If uploading a PDF fails:

- Open the `/etc/ImageMagick-6/policy.xml` file (the path may not be exactly this one).
- Look for the following line:

```
 <policy domain="coder" rights="none" pattern="PDF" />
```

- Update the `rights` attribute as follows:

```
 <policy domain="coder" rights="read|write" pattern="PDF" />
```

## Configuration

The two following environment variables are defined in `.env`, and you may update them if needed:

- `DB_PATH`: Path to the sqlite database file, relative to the repository root. Default value is `./data/data.db`.
- `PORT`: Port the server listens to. Default value is `8000`.

## Commands

After cloning, run the setup command:

```
npm install
```

To start the application:

```
npm run start
```

To run all the tests:

```
npm run test
```

_Remark_: The database is created when the application starts for the first time.

## APIs

The application exposes two APIs.

### Upload

The `/1/pdf/upload` route is a POST route to upload a PDF. It expects in the body a mandatory argument `url`, which is the URL of the PDF to download, and an optional argument `hook`, which is the URL of the webhook to call back.

Example usages:

```
$ curl -X POST -H 'Content-Type: application/json' -d '{"url": "http://localhost:7000/5.pdf"}' http://localhost:8000/1/pdf/upload

$ curl -X POST -H 'Content-Type: application/json' -d '{"url": "http://localhost:7000/5.pdf", "hook": "http://localhost:7000/hook"}' http://localhost:8000/1/pdf/upload

```

(The `http://localhost:7000/` server in these examples is a test server exposing the download and the webhook routes).

The hook URL must be a POST with the following elements (as defined in `src/webhook/postHook.ts`):

```
export interface HookData {
  url: string;
  ok: boolean;
  statusText: string;
}
```

The `url` is the one passed as an argument to the original route, `ok` is true if the process succeeded, else false, `statusText` contains the error message if the process failed, or an empty string.

### Fetching data

The `/1/pdf/thumbnails` route is a GET route that returns the original pdf contents and the calculated thumbnails in the following format (as defined in `src/models/PdfThumbnails.ts`):

```
export interface PdfThumbnail {
  id: number;
  url: string;
  pdf: string;
  thumbnail: string;
}
```

The `id` field is a numerical id; the `url` field is the original url; the `pdf` field contains the contents of the original PDF in base64 format; the `thumbnail` field contains the JPEG of the first page of the PDF in base64 format.

Two optional query parameters enable pagination:

- `from` is the zero-based index to start at. Defaults to `0`.
- `size` is the maximum number of elements to return. Defaults to `0`, which indicates no limit.

The `from` parameter can only be used if `size` is not 0 (this is a consequence of sqlite needing a `LIMIT` when using an `OFFSET`).

Example usages:

```
$ curl "http://localhost:8000/1/pdf/thumbnails"
$ curl "http://localhost:8000/1/pdf/thumbnails?from=3&size=3"
```

## Remarks

- I chose to split the conversion algorithms in three functions (`src/conversion/fetchPdf.ts`, `src/conversion/getThumbnail.ts`, `src/conversion/processUrl.ts`, this latter orchestrating the whole process) to simplify development and testing. On the other hand, it may complicate the understanding of the whole process; that's typically the sort of things I would discuss in a code review.

- I added JSDoc on most functions and methods when needed. I know that some people may consider them unnecessary, whereas others may consider them absolutely mandatory. It is essentially a convention with pros and cons.

- The application end-to-end tests (`src/__tests__/app.test.ts`) are rather complex: We add two routes to the application on the fly, one to download the PDF and the other exposing the webhook, and we need to coordinate uploads, hook calls and fetching, which complexify the tests.

- There is no security, and no sanity checks of the various URLs that are received (download and webhook), which is a disputable practice would the API be exposed to the Internet.

- There is no "production" build and execution: `npm run start` is a development deployemnt.
