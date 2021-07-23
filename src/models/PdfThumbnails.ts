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

  constructor(dbPath = process.env.DB_PATH) {
    if (!dbPath) {
      throw new Error('No path provided and DB_PATH not set');
    }
    const actualPath = this.normalizePath(dbPath);
    this.db = new sqlite3.Database(actualPath, (err: Error | null) => {
      if (err) {
        throw err;
      }
    });
  }

  private normalizePath(dbPath: string) {
    let targetPath = dbPath;
    if (targetPath !== ':memory:') {
      const rootPath = `${path.dirname(__filename)}/../..`;
      targetPath = path.normalize(`${rootPath}/${dbPath}`);
    }
    return targetPath;
  }

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

  async fetch(from: number = 0, size: number = 0): Promise<Thumbnail[]> {
    const rows: Thumbnail[] = await this.all(
      `
            SELECT url, thumbnail, created
            FROM pdf_thumbnails
            ORDER BY created DESC
        `
    );
    return rows;
  }

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
