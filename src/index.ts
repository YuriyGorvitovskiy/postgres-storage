import * as fs from "fs";
import * as yargs from "yargs";

import { app } from "./rest/app";
import { setup } from "./database/postgres";

interface Settings {
    database: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        max: number;
        idleTimeoutMillis: number;
        connectionTimeoutMillis: number;
    };
    server: {
        port: number;
    };
}
const argv = (yargs as yargs.Argv<Settings>)
    .usage("Usage: $0 [options]")
    .version()
    .alias("v", "version")
    .help()
    .alias("h", "help")
    .config("config", (path) => JSON.parse(fs.readFileSync(path, "utf-8")))
    .default("config", "settings.json")
    .alias("c", "config").argv;

console.log("Args: " + JSON.stringify(argv));

setup(argv.database);
app.listen(argv.server.port || 8080);
