import * as express from "express";
import * as bodyParser from "body-parser";
import * as BLD from "../query/sql-builder";
import * as PS from "../query/postgres";

export const app = express();
app.use(bodyParser.json());

app.get("/jql/:schema", (req, res) => {
    const [select, reader] = BLD.toSQL(req.body);
    const sql = PS.toSql(select);
    res.type("text");
    res.send("Schema: " + req.params.schema + "\nSQL:\n" + sql);
});
