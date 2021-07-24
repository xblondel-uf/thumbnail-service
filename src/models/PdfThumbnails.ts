import path from 'path';
import sqlite3 from 'sqlite3';

export interface PdfThumbnail {
  id: number;
  url: string;
  pdf: string;
  thumbnail: string;
}

const SQLITE_CONSTRAINT_ERRNO = 19;

/**
 * Model of the of the storage of pdf and thumbnails.
 */
export class PdfThumbnails {
  private db: sqlite3.Database;

  /**
   * Constructor
   *
   * @param dbPath - Path to the sqlite database
   */
  constructor(dbPath: string) {
    if (!dbPath) {
      throw new Error('No path provided');
    }
    const actualPath = this.normalizePath(dbPath);
    this.db = new sqlite3.Database(actualPath, (err: Error | null) => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * Setup the database tables if they do not exist.
   *
   * @returns Nothing
   */
  async setup(): Promise<void> {
    // The database is split in 3 tables, to isolate the largest columns (pdf data and thumbnail data) in their own tables.
    // This avoids having rows that are too large an dimpact performance.
    return this.exec(
      `
        CREATE TABLE IF NOT EXISTS pdf_url (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL
        );
        CREATE UNIQUE INDEX pdf_url_idx ON pdf_url(url);
        CREATE TABLE IF NOT EXISTS pdf_data (
          id INTEGER NOT NULL PRIMARY KEY,
          pdf TEXT NOT NULL,
          FOREIGN KEY(id) REFERENCES pdf_url(id)
        );
        CREATE TABLE IF NOT EXISTS thumbnail_data (
          id INTEGER NOT NULL PRIMARY KEY,
          thumbnail TEXT NOT NULL,
          FOREIGN KEY(id) REFERENCES pdf_url(id)
        );
      `
    );
  }

  /**
   * Insert a (url, pdf, thumbnail) triplet into the database.
   *
   * @param url - Url to insert
   * @param pdf - Pdf to insert
   * @param thumbnail - Thumbnail associated to the URL
   * @returns Nothing
   */
  async insert(url: string, pdf: string, thumbnail: string): Promise<void> {
    return this.run('BEGIN TRANSACTION;')
      .then(async () => {
        await this.run(
          `
          INSERT INTO pdf_url (url) VALUES (?);
        `,
          [url]
        );
        await this.run(
          `
          INSERT INTO pdf_data (id, pdf) VALUES (LAST_INSERT_ROWID(), ?);
        `,
          [pdf]
        );
        this.run(
          `
          INSERT INTO thumbnail_data (id, thumbnail) VALUES (LAST_INSERT_ROWID(), ?);
        `,
          [thumbnail]
        );
      })
      .then(() => this.run('END TRANSACTION;'))
      .catch(async (err) => {
        await this.run('ROLLBACK TRANSACTION;');

        // we ignore constraint errors (duplicate insertions)
        if (err.errno === SQLITE_CONSTRAINT_ERRNO) {
          return;
        }

        throw err;
      });
  }

  /**
   * Retrieve the data from the database, most recently inserted first.
   *
   * @param from - Zero-based index to start at, ignored if size is 0
   * @param size - Number of elements to retrieve, all if 0
   * @returns The data stored in the database.
   */
  async fetch(from: number = 0, size: number = 0): Promise<PdfThumbnail[]> {
    let sql = `
            SELECT pdf_url.id, url, pdf, thumbnail
            FROM pdf_url
            JOIN pdf_data
            ON pdf_url.id = pdf_data.id
            JOIN thumbnail_data
            ON pdf_url.id = thumbnail_data.id
            ORDER BY pdf_url.id DESC
        `;
    if (size > 0) {
      sql += `LIMIT ${from}, ${size}`;
    }
    const rows: PdfThumbnail[] = await this.all(sql);
    return rows;
  }

  /**
   * Checks if the url is already in the database.
   *
   * @param url - Url to check
   * @returns - true if the url already is in the database
   */
  async exists(url: string): Promise<boolean> {
    const rows = await this.get(
      `
            SELECT 1
            FROM pdf_url
            WHERE url = ?
            `,
      [url]
    );
    return rows != null;
  }

  //
  // Private methods
  //

  /**
   * Normalize the path passed as parameter, aligning it to the root path of the directory.
   *
   * @param dbPath - Path to normalize
   * @returns Normalized path
   */
  private normalizePath(dbPath: string) {
    let targetPath = dbPath;
    if (targetPath !== ':memory:') {
      const rootPath = `${path.dirname(__filename)}/../..`;
      targetPath = path.normalize(`${rootPath}/${dbPath}`);
    }
    return targetPath;
  }

  //
  // These private functions abstract fetching the database and closing it when
  // executing a command.
  // For convenience, they expose a promise interface (even though sqlite3 remains
  // synchronous).
  //

  private async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  private async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  private async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
