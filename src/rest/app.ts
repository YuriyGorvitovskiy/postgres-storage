import * as express from "express";
import * as bodyParser from "body-parser";
import * as BLD from "../query/sql-builder";
import * as PG from "../database/postgres";

export const app = express();
app.use(bodyParser.json());
app.use(express.static("../model-browser/build/web"));

app.get("/record/:schema/:table/:id", async (req, res) => {
    try {
        const sql = `\
SELECT * 
  FROM ${PG.identifier(req.params.schema)}.${PG.identifier(req.params.table)} 
 WHERE id = $1`;
        const rs = await PG.execute(sql, [req.params.id]);

        if (!rs.rows || 0 === rs.rows.length) {
            res.status(404).send("Not found");
            return;
        }
        res.type("json");
        res.send(JSON.stringify(rs.rows[0]));
    } catch (ex) {
        res.status(500).send(JSON.stringify(ex, Object.getOwnPropertyNames(ex)));
    }
});

app.get("/record/:schema/:table", async (req, res) => {
    try {
        const sql = `\
SELECT * 
  FROM ${PG.identifier(req.params.schema)}.${PG.identifier(req.params.table)} 
 ORDER BY id DESC 
 LIMIT $1 
OFFSET $2`;
        const rs = await PG.execute(sql, [req.query.limit || 10, req.query.skip || 0]);

        res.type("json");
        res.send(JSON.stringify(rs.rows));
    } catch (ex) {
        res.status(500).send(JSON.stringify(ex, Object.getOwnPropertyNames(ex)));
    }
});

app.post("/jql/:schema", async (req, res) => {
    try {
        const [select, reader] = BLD.toSQL(req.body);
        const sql = PG.toSql(req.params.schema, select);
        if (req.query.sql) {
            res.type("text");
            res.send(sql);
            return;
        }

        const rs = await PG.execute(sql);
        res.type("json");
        res.send(JSON.stringify(reader(rs.rows)));
    } catch (ex) {
        res.status(500).send(JSON.stringify(ex, Object.getOwnPropertyNames(ex)));
    }
});
