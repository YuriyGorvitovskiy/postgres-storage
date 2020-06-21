import * as pg from "pg";

let dbPool: pg.Pool = null;

export const setup = (options: any) => {
    dbPool = new pg.Pool(options);
};

export const execute = async (sql: string): Promise<pg.QueryResult<any>> => {
    const client = await dbPool.connect();
    try {
        return await client.query(sql);
    } finally {
        client.release();
    }
};
