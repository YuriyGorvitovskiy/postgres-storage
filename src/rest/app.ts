import * as express from "express";
import * as bodyParser from "body-parser";
import * as BLD from "../query/sql-builder";
import * as PS from "../query/postgres";
import * as PG from "../database/postgres";

export const app = express();
app.use(bodyParser.json());

app.get("/jql/:schema", async (req, res) => {
    const [select, reader] = BLD.toSQL(req.body);
    await PG.execute("SET search_path = " + req.params.schema + ", public");

    const sql = PS.toSql(select);
    const rs = await PG.execute(sql);

    res.type("json");
    res.send(JSON.stringify(reader(rs.rows)));
});
