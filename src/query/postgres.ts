import * as SQL from "./sql";
import { escape } from "sqlstring";
import { List } from "immutable";

const literalToSql = (f: SQL.Literal): string => {
    const val = f.val;
    if (null == val) return "NULL";
    switch (typeof f.val) {
        case "boolean":
            return val ? "TRUE" : "FALSE";
        case "number":
            return val.toString(10);
        case "string":
            return "E" + escape(val);
        default:
            break;
    }
    if (f.val instanceof Date) return "'" + (val as Date).toISOString() + "'";

    throw Error("Literal " + JSON.stringify(f) + " is not supported");
};
const columnToSql = (c: SQL.Column): string => {
    return c.tbl + "." + c.col;
};

const fieldToSql = (f: SQL.Field): string => {
    return expressionToSql(f.val, false) + " AS " + f.as;
};

const booleanToSql = (inv: boolean, op: string, args: List<SQL.Expression>): string => {
    const expr = args.map((a) => expressionToSql(a, args.size > 1)).join(" " + op + " ");
    return inv ? "NOT (" + expr + ")" : expr;
};

const betweenToSql = (inv: boolean, args: List<SQL.Expression>): string => {
    return (
        expressionToSql(args.get(0), true) +
        (inv ? " NOT BETWEEN " : " BETWEEN ") +
        expressionToSql(args.get(1), true) +
        " AND " +
        expressionToSql(args.get(2), true)
    );
};

const operatorToSql = (op: string, args: List<SQL.Expression>): string => {
    return expressionToSql(args.get(0), true) + " " + op + " " + expressionToSql(args.get(1), true);
};

const inToSql = (inv: boolean, args: List<SQL.Expression>): string => {
    return (
        expressionToSql(args.get(0), true) +
        (inv ? " NOT IN (" : " IN (") +
        args
            .shift()
            .map((a) => expressionToSql(a, false))
            .join(", ") +
        ")"
    );
};

const isNullToSql = (inv: boolean, args: List<SQL.Expression>): string => {
    return expressionToSql(args.get(0), true) + (inv ? " IS NOT NULL" : " IS NULL");
};

const predicateToSql = (p: SQL.Predicate): string => {
    switch (p.cmp) {
        case "and":
            return booleanToSql(p.inv, "AND", p.args);
        case "or":
            return booleanToSql(p.inv, "OR", p.args);
        case "between":
            return betweenToSql(p.inv, p.args);
        case "equal":
            return operatorToSql(p.inv ? "!=" : "=", p.args);
        case "greater":
            return operatorToSql(p.inv ? "<=" : ">", p.args);
        case "lesser":
            return operatorToSql(p.inv ? ">=" : "<", p.args);
        case "like":
            return operatorToSql(p.inv ? "NOT LIKE" : "LIKE", p.args);
        case "in":
            return inToSql(p.inv, p.args);
        case "is null":
            return isNullToSql(p.inv, p.args);
        default:
            break;
    }
    throw Error("Predicate " + JSON.stringify(p) + " is not supported");
};

const expressionToSql = (e: SQL.Expression, inExpr: boolean): string => {
    if ("tbl" in e) {
        return columnToSql(e as SQL.Column);
    }
    if ("cmp" in e) {
        const expr = predicateToSql(e as SQL.Predicate);
        return inExpr ? "(" + expr + ")" : expr;
    }
    if ("val" in e) {
        return literalToSql(e as SQL.Literal);
    }
};

const joinKindToSql = (kind: SQL.JoinKind): string => {
    switch (kind) {
        case "from":
            return "  FROM";
        case "inner":
            return " INNER JOIN";
        case "left":
            return "  LEFT JOIN";
        default:
            break;
    }
    throw Error("Join kind " + JSON.stringify(kind) + " is not supported");
};
const joinToSql = (j: SQL.Join): string => {
    return joinKindToSql(j.kind) + " " + j.tbl + " " + j.as + (j.on ? " ON " + predicateToSql(j.on) : "");
};

export const toSql = (select: SQL.Select): string => {
    return (
        "SELECT " +
        select.fields.map((f) => fieldToSql(f)).join(",\n       ") +
        "\n" +
        select.joins.map((j) => joinToSql(j)).join("\n") +
        (select.where ? "\n WHERE " + predicateToSql(select.where) : "")
    );
};
