import path from 'path';
import sqlite3 from "sqlite3";

/**
 * Model of the pdf_thumbnails table
 */
export class PdfThumbnails {
    private dbFullpath : string

    constructor (dbPath = process.env.DB_PATH) {
        if (!dbPath) {
            throw new Error("No path provided and DB_PATH not set");
        }
        const rootPath = `${path.dirname(__filename)}/../..`;
        const targetPath = path.normalize(`${rootPath}/${dbPath}`);
        this.dbFullpath = targetPath;
    }

    async setup() : Promise<void> {
        return this.run(
            `
            CREATE TABLE IF NOT EXISTS pdf_thumbnails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                thumbnail TEXT NOT NULL
            );
            `
        );
    }

    async insert(url: string, thumbnail: string) : Promise<void> {
        return this.run(
            `
            INSERT INTO pdf_thumbnails (url, thumbnail)
            VALUES(?, ?)
            `,
            [url, thumbnail]
        )
    }

    async fetch(from: number = 0, size: number = 0) : Promise<any[]> {
        let rows: any[] = [];
        const row = await this.all(
        `
            SELECT id, url, thumbnail FROM pdf_thumbnails
        `
        );
        return rows;
    }

    async exists(url: string) : Promise<boolean> {
        const rows = await this.get(
            `
            SELECT 1
            FROM pdf_thumbnails
            WHERE url = ?
            `,
            [url],
        );
        return rows.length > 0;
    }

    //
    // These preivate functions abstract fetching the database and closing it when
    // executing a command.
    // For convenience, they expose a promise interface (even though sqlite3 remains
    // synchonous).
    //
    private db() : sqlite3.Database {
        return new sqlite3.Database(this.dbFullpath, (err: Error | null) => {
            if (err) {
                throw err;
            }
        });

    }
    private async get(sql: string, params: any[] = []) : Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = this.db();
            db.get(sql, params, (err, data) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    private async all(sql: string, params: any[] = []) : Promise<any[]> {
        return new Promise((resolve, reject) => {
            const db = this.db();
            db.all(sql, params, (err, data) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    private async run(sql: string, params: any[] = []) : Promise<void> {
        return new Promise((resolve, reject) => {
            const db = this.db();
            db.run(sql, params, (err) => {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

