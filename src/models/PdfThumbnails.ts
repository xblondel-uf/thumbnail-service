import path from 'path';
import sqlite3 from 'sqlite3';

export interface Thumbnail {
  url: string;
  thumbnail: string;
  created: string;
}

const SQLITE_CONSTRAINT_ERRNO = 19;

/**
 * Model of the pdf_thumbnails table
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
   * Setup the database table if it does not exist.
   *
   * @returns Nothing
   */
  async setup(): Promise<void> {
    return this.run(
      `
        CREATE TABLE IF NOT EXISTS pdf_thumbnails (
            url TEXT NOT NULL PRIMARY KEY,
            thumbnail TEXT NOT NULL,
            created DATETIME NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'now'))
        );
      `
    );
  }

  /**
   * Insert a (url, thumbnail) pair into the database.
   *
   * @param url - Url to insert
   * @param thumbnail - Thumbnail associated to the URL
   * @returns Nothing
   */
  async insert(url: string, thumbnail: string): Promise<void> {
    return this.run(
      `
            INSERT INTO pdf_thumbnails (url, thumbnail)
            VALUES(?, ?)
            `,
      [url, thumbnail]
    ).catch((err) => {
      // we ignore constraint errors (duplicate insertions)
      if (err.errno !== SQLITE_CONSTRAINT_ERRNO) {
        throw err;
      }
    });
  }

  /**
   * Retrieve the data from the database, most recently inserted first.
   *
   * @param from - Zero-based index to start at, ignored if size is 0
   * @param size - Number of elements to retrieve, all if 0
   * @returns The data stored in the database.
   */
  async fetch(from: number = 0, size: number = 0): Promise<Thumbnail[]> {
    let sql = `
            SELECT url, thumbnail, created
            FROM pdf_thumbnails
            ORDER BY created DESC
        `;
    if (size > 0) {
      sql += `LIMIT ${from}, ${size}`;
    }
    const rows: Thumbnail[] = await this.all(sql);
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
            FROM pdf_thumbnails
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
}
