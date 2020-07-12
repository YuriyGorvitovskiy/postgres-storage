import { List } from "immutable";

export type primitive = boolean | number | string | Date;

export interface Literal {
    readonly val: primitive;
}

export interface Column {
    readonly tbl: string;
    readonly col: string;
}

export type PredicateOperator = "and" | "between" | "equal" | "greater" | "in" | "is null" | "lesser" | "like" | "or";

export interface Predicate {
    readonly inv: boolean;
    readonly cmp: PredicateOperator;
    readonly args: List<Expression>;
}

export type Expression = Column | Predicate | Literal;

export type JoinKind = "from" | "inner" | "left" | "full";

export interface Join {
    readonly kind: JoinKind;
    readonly tbl: string;
    readonly as: string;
    readonly on: Predicate;
}

export interface Field {
    readonly val: Expression;
    readonly as: string;
}

export interface Select {
    readonly fields: List<Field>;
    readonly joins: List<Join>;
    readonly where: Predicate;
}

export const select = (fields: List<Field>, joins: List<Join>, where: Predicate): Select => ({ fields, joins, where });

export const literal = (val: primitive): Literal => ({ val });
export const column = (tbl: string, col: string): Column => ({ tbl, col });

export const field = (val: Expression, as: string): Field => ({ val, as });

const bool = (cmp: "and" | "or", args: List<Predicate>): Predicate => {
    if (args.isEmpty()) {
        return null;
    }
    if (1 === args.size) {
        return args.get(0);
    }
    return { inv: false, cmp, args };
};
export const and = (prs: List<Predicate>): Predicate => bool("and", prs);
export const andOf = (...prs: Predicate[]): Predicate => and(List(prs));
export const or = (prs: List<Predicate>): Predicate => bool("or", prs);
export const orOf = (...prs: Predicate[]): Predicate => or(List(prs));
export const not = (pr: Predicate): Predicate => ({ inv: !pr.inv, cmp: pr.cmp, args: pr.args });

export const isEqual = (a: Expression, b: Expression): Predicate => ({ inv: false, cmp: "equal", args: List([a, b]) });
export const notEqual = (a: Expression, b: Expression): Predicate => ({ inv: true, cmp: "equal", args: List([a, b]) });

export const isGreater = (a: Expression, b: Expression): Predicate => ({
    inv: false,
    cmp: "greater",
    args: List([a, b]),
});
export const notGreater = (a: Expression, b: Expression): Predicate => ({
    inv: true,
    cmp: "greater",
    args: List([a, b]),
});

export const isLesser = (a: Expression, b: Expression): Predicate => ({
    inv: false,
    cmp: "lesser",
    args: List([a, b]),
});
export const notLesser = (a: Expression, b: Expression): Predicate => ({
    inv: true,
    cmp: "lesser",
    args: List([a, b]),
});

export const isLike = (a: Expression, b: Expression): Predicate => ({ inv: false, cmp: "like", args: List([a, b]) });
export const notLike = (a: Expression, b: Expression): Predicate => ({ inv: true, cmp: "like", args: List([a, b]) });

export const isBetween = (a: Expression, min: Expression, max: Expression): Predicate => ({
    inv: false,
    cmp: "between",
    args: List([a, min, max]),
});
export const notBetween = (a: Expression, min: Expression, max: Expression): Predicate => ({
    inv: true,
    cmp: "between",
    args: List([a, min, max]),
});

export const isNull = (a: Expression): Predicate => ({ inv: false, cmp: "is null", args: List([a]) });
export const notNull = (a: Expression): Predicate => ({ inv: true, cmp: "is null", args: List([a]) });

export const isIn = (a: Expression, ...l: Expression[]): Predicate => ({
    inv: false,
    cmp: "in",
    args: List([a, ...l]),
});
export const notIn = (a: Expression, ...l: Expression[]): Predicate => ({
    inv: true,
    cmp: "in",
    args: List([a, ...l]),
});

export const from = (tbl: string, as: string): Join => ({ kind: "from", tbl, as, on: null });
export const inner = (tbl: string, as: string, on: Predicate): Join => ({ kind: "inner", tbl, as, on });
export const left = (tbl: string, as: string, on: Predicate): Join => ({ kind: "left", tbl, as, on });
export const full = (tbl: string, as: string, on: Predicate): Join => ({ kind: "full", tbl, as, on });
