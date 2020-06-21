import * as JQL from "./jql";
import * as SQL from "./sql";
import * as IM from "immutable";

type ResultReader = (rows: any[]) => IM.List<IM.Map<string, any>>;
type RowReader = (acc: IM.Map<string, any>, row: any) => IM.Map<string, any>;

const EMPTY_LIST = IM.List();
const EMPTY_OMAP = IM.OrderedMap();
const EMPTY_READER: RowReader = (a) => a;

interface Selector {
    readonly fields: IM.List<SQL.Field>;
    readonly joins: IM.List<SQL.Join>;
    readonly preds: IM.List<SQL.Predicate>;
    readonly reader: RowReader;
}

interface Context {
    readonly tableAlias: string;
    readonly nextTableAlias: () => string;
    readonly nextColumnAlias: () => string;
}

export const toSQL = <R>(implicitQuery: JQL.Query<R>): [SQL.Select, ResultReader] => {
    const query = JQL.fillDefaults(implicitQuery);
    const ctx = initialContext();
    const join = SQL.from(query.$type, ctx.tableAlias);
    const id = SQL.column(ctx.tableAlias, "id");
    const as = ctx.nextColumnAlias();

    const childrenSelector = addChildren(ctx, query);

    return [
        {
            fields: childrenSelector.fields.unshift(SQL.field(id, as)),
            joins: childrenSelector.joins.unshift(join),
            where: SQL.and(childrenSelector.preds),
        },
        (rows) => listifyOrderedMaps(readResultSet(rows, as, childrenSelector.reader)),
    ];
};

const initialContext = (): Context => {
    let tableCounter = 0;
    let columnCounter = 0;
    const nextTableAlias = () => "t" + ++tableCounter;
    const nextColumnAlias = () => "c" + ++columnCounter;
    return {
        tableAlias: nextTableAlias(),
        nextTableAlias,
        nextColumnAlias,
    };
};

const nextContext = (ctx: Context): Context => {
    return {
        tableAlias: ctx.nextTableAlias(),
        nextTableAlias: ctx.nextTableAlias,
        nextColumnAlias: ctx.nextColumnAlias,
    };
};

const addChildren = <R>(ctx: Context, query: JQL.StrictSubQuery<any> | JQL.StrictQuery<any>): Selector => {
    const selectors = IM.List(
        Object.entries(query)
            .filter(([k]) => !k.startsWith("$"))
            .map(([k, v]) => addChild(ctx, k, v as JQL.StrictSubQuery<any> | JQL.StrictField))
    );

    return {
        fields: selectors.flatMap((s) => s.fields),
        joins: selectors.flatMap((s) => s.joins),
        preds: selectors.flatMap((s) => s.preds),
        reader: (acc, row) => selectors.reduce((a, s) => (s.reader ? s.reader(a, row) : a), acc),
    };
};

const addChild = <R>(ctx: Context, name: string, query: JQL.StrictSubQuery<any> | JQL.StrictField): Selector => {
    return "$type" in query
        ? addSubQuery(ctx, name, query as JQL.StrictSubQuery<any>)
        : addField(ctx, name, query as JQL.StrictField);
};

const addSubQuery = <R>(prevCtx: Context, name: string, query: JQL.StrictSubQuery<R>): Selector => {
    const nextCtx = nextContext(prevCtx);
    const on = query.$rev
        ? SQL.isEqual(SQL.column(nextCtx.tableAlias, query.$field), SQL.column(prevCtx.tableAlias, "id"))
        : SQL.isEqual(SQL.column(nextCtx.tableAlias, "id"), SQL.column(prevCtx.tableAlias, query.$field));

    const join =
        "exist" === query.$cmp
            ? SQL.inner(query.$type, nextCtx.tableAlias, on)
            : SQL.left(query.$type, nextCtx.tableAlias, on);

    const id = SQL.column(nextCtx.tableAlias, "id");
    const preds = "not exist" === query.$cmp ? IM.List.of(SQL.isNull(id)) : EMPTY_LIST;

    let fields = EMPTY_LIST;
    let alias = null;
    if (query.$select) {
        alias = prevCtx.nextColumnAlias();
        fields = IM.List.of(SQL.field(id, alias));
    }

    const childrenSelector = addChildren(nextCtx, query);
    const reader = query.$select
        ? query.$rev
            ? (acc, row) => readPluralRecord(acc, name, row, alias, childrenSelector.reader)
            : (acc, row) => readSingleRecord(acc, name, row, alias, childrenSelector.reader)
        : EMPTY_READER;

    return {
        fields: fields.concat(childrenSelector.fields),
        joins: childrenSelector.joins.unshift(join),
        preds: preds.concat(childrenSelector.preds),
        reader,
    };
};

const addField = (ctx: Context, name: string, fld: JQL.StrictField): Selector => {
    const col = SQL.column(ctx.tableAlias, fld.$field);
    const preds = "any" === fld.$cmp ? EMPTY_LIST : IM.List.of(toPredicate(fld, col));

    let fields = EMPTY_LIST;
    let reader = EMPTY_READER;
    if (fld.$select && "id" !== fld.$field) {
        const alias = ctx.nextColumnAlias();
        fields = IM.List.of(SQL.field(col, alias));
        reader = (acc, row) => acc.set(name, row[alias]);
    }

    return {
        joins: EMPTY_LIST,
        preds,
        fields,
        reader,
    };
};

const toPredicate = (fld: JQL.StrictField, col: SQL.Column): SQL.Predicate => {
    switch (fld.$cmp) {
        case "=":
            return SQL.isEqual(col, SQL.literal(fld.$value[0]));
        case "!=":
            return SQL.notEqual(col, SQL.literal(fld.$value[0]));
        case "in":
            return SQL.isIn(col, ...fld.$value.map((v) => SQL.literal(v)));
        case "not in":
            return SQL.notIn(col, ...fld.$value.map((v) => SQL.literal(v)));
        case "><":
            return SQL.isBetween(col, SQL.literal(fld.$value[0]), SQL.literal(fld.$value[1]));
        case "<>":
            return SQL.notBetween(col, SQL.literal(fld.$value[0]), SQL.literal(fld.$value[1]));
        case "<":
            return SQL.isLesser(col, SQL.literal(fld.$value[0]));
        case ">":
            return SQL.isGreater(col, SQL.literal(fld.$value[0]));
        case "<=":
            return SQL.notGreater(col, SQL.literal(fld.$value[0]));
        case ">=":
            return SQL.notLesser(col, SQL.literal(fld.$value[0]));
        case "like":
            return SQL.isLike(col, SQL.literal(fld.$value[0]));
        case "not like":
            return SQL.notLike(col, SQL.literal(fld.$value[0]));
    }
    throw Error("Comparison " + JSON.stringify(fld.$cmp) + " is not supported");
};

const readResultSet = (
    rows: any[],
    idColumn: string,
    rowReader: RowReader
): IM.OrderedMap<string, IM.Map<string, any>> => {
    return rows.reduce((acc, row) => {
        const rowId = row[idColumn];
        const key = "" + rowId;
        const beginRecord = acc.get(key);
        const argRecord = beginRecord || IM.Map({ id: rowId });
        const endRecord = rowReader(argRecord, row);
        if (beginRecord === endRecord) {
            return acc;
        }
        return acc.set(key, endRecord);
    }, EMPTY_OMAP);
};

const readSingleRecord = (
    acc: IM.Map<string, any>,
    accField: string,
    row: any,
    idColumn: string,
    childReader: RowReader
): IM.Map<string, any> => {
    const rowId = row[idColumn];
    if (null == rowId) {
        return acc.set(accField, null);
    }
    const beginRecord = acc.get(accField) as IM.Map<string, any>;
    const argRecord = beginRecord || IM.Map({ id: rowId });
    const endRecord = childReader(argRecord, row);
    return beginRecord === endRecord ? acc : acc.set(accField, endRecord);
};

const readPluralRecord = (
    acc: IM.Map<string, any>,
    accField: string,
    row: any,
    idColumn: string,
    childReader: RowReader
): IM.Map<string, any> => {
    const rowId = row[idColumn];
    const queryRecords = acc.get(accField) as IM.OrderedMap<string, IM.Map<string, any>>;
    if (null == rowId) {
        return queryRecords || acc.set(accField, EMPTY_OMAP);
    }
    const key = "" + rowId;
    const beginRecord = queryRecords?.get(key);
    const argRecord = beginRecord || IM.Map({ id: rowId });
    const endRecord = childReader(argRecord, row);
    return beginRecord === endRecord ? acc : acc.set(accField, (queryRecords || EMPTY_OMAP).set(key, endRecord));
};

const listifyOrderedMaps = (omap: IM.OrderedMap<string, IM.Map<string, any>>): IM.List<IM.Map<string, any>> => {
    return omap
        .toList()
        .map((e) =>
            e.mapEntries(([k, v]) => [
                k,
                IM.OrderedMap.isOrderedMap(v) ? listifyOrderedMaps(v as IM.OrderedMap<string, IM.Map<string, any>>) : v,
            ])
        );
};
