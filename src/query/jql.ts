import * as IM from "immutable";

export type primitive = boolean | number | string | Date;
export type value = primitive | readonly primitive[];

const VALUE_TYPEOF = IM.Set.of("number", "boolean", "string");
const isValue = (v: any): boolean => {
    return null == v || Array.isArray(v) || VALUE_TYPEOF.contains(typeof v) || v instanceof Date;
};

export type FieldComparison =
    | "any"
    | "="
    | "!="
    | "in"
    | "not in"
    | "><"
    | "<>"
    | "<="
    | "<"
    | ">"
    | ">="
    | "like"
    | "not like";
export type ChildComparison = "exist" | "not exist" | "all";
export interface Field {
    readonly $field?: string;
    readonly $cmp?: FieldComparison;
    readonly $value?: value;
    readonly $select?: boolean;
}

export interface StrictField {
    readonly $field: string;
    readonly $cmp: FieldComparison;
    readonly $value: readonly primitive[];
    readonly $select: boolean;
}

export declare type SubQuery<R> = {
    readonly [key in keyof R | "$type" | "$rev" | "$cmp" | "$field" | "$select"]?: key extends "$type"
        ? string
        : key extends "$rev"
        ? boolean
        : key extends "$cmp"
        ? ChildComparison
        : key extends "$field"
        ? string
        : key extends "$select"
        ? boolean
        : key extends keyof R
        ? SubQuery<R[key]> | Field | value
        : void;
};

export declare type StrictSubQuery<R> = {
    readonly [key in keyof R | "$type" | "$rev" | "$cmp" | "$field" | "$select"]: key extends "$type"
        ? string
        : key extends "$rev"
        ? boolean
        : key extends "$cmp"
        ? ChildComparison
        : key extends "$field"
        ? string
        : key extends "$select"
        ? boolean
        : key extends keyof R
        ? StrictSubQuery<R[key]> | StrictField
        : void;
};

export declare type Query<R> = {
    readonly [key in keyof R | "$type"]?: key extends "$type"
        ? string
        : key extends keyof R
        ? SubQuery<R[key]> | Field | value
        : void;
};

export declare type StrictQuery<R> = {
    readonly [key in keyof R | "$type"]: key extends "$type"
        ? string
        : key extends keyof R
        ? StrictSubQuery<R[key]> | StrictField
        : void;
};

export const fillDefaults = <R>(query: Query<R>): StrictQuery<R> => {
    return {
        $type: query.$type,
        ...fillChildrenDefaults(query, true),
    } as StrictQuery<R>;
};

const fillChildrenDefaults = <R, S extends Query<R> | SubQuery<R>>(query: S, parentSelect: boolean): any => {
    return Object.fromEntries(
        Object.entries(query)
            .filter(([k]) => !k.startsWith("$"))
            .map(([k, v]) => [k, fillChildDefaults(k as keyof R, v, parentSelect)])
    );
};

const fillChildDefaults = <
    R,
    F extends SubQuery<R> | Field | value,
    O extends F extends SubQuery<R> ? StrictSubQuery<R> : StrictField
>(
    k: keyof R,
    v: F,
    parentSelect: boolean
): O => {
    return isValue(v)
        ? (fillFieldDefaults(k, { $value: v as value }, parentSelect) as O)
        : "$type" in v || k.toString().includes(":")
        ? (fillSubQueryDefaults(k, v as SubQuery<R>, parentSelect) as O)
        : (fillFieldDefaults(k, v as Field, parentSelect) as O);
};
const fillSubQueryDefaults = <R, S>(key: keyof R, query: SubQuery<S>, parentSelect: boolean): StrictSubQuery<S> => {
    const select = parentSelect && false !== query.$select;
    const [part1, type] = key.toString().split(":");
    const rev = part1.startsWith("^");
    const cmp = part1.endsWith("!") ? "exist" : "any";
    const name = part1.replace(/^\^/, "").replace(/\!$/, "");
    return {
        $type: query.$type || type,
        $rev: query.$rev || rev,
        $field: query.$field || name,
        $cmp: query.$cmp || cmp,
        $select: select,
        ...fillChildrenDefaults(query, select),
    };
};
const fillFieldDefaults = <R>(key: keyof R, field: Field, parentSelect: boolean): StrictField => {
    const select = parentSelect && false !== field.$select;
    return {
        $field: field.$field || (key as string),
        $cmp: field.$cmp || (!("$value" in field) ? "any" : Array.isArray(field.$value) ? "in" : "="),
        $value: Array.isArray(field.$value) ? field.$value : [field.$value],
        $select: select,
    };
};
