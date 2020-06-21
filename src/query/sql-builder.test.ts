import * as JQL from "./jql";
import * as SQL from "./sql";
import * as PG from "./postgres";

import * as SB from "./sql-builder";

test("Simple forward query", () => {
    // Setup
    interface IResult {
        id: number;
        label: string;
        hrcdpayq: number;
        rgmqgeete: {
            label: string;
        };
    }

    const query: JQL.Query<IResult> = {
        $type: "hltrfv",
        id: {},
        label: {},
        hrcdpayq: {
            $cmp: "<",
            $value: 0,
        },
        rgmqgeete: {
            $type: "casbwpilgejqgunxera",
            label: {},
        },
    };

    // Execute
    const [select, reader] = SB.toSQL(query);

    // Verify
    expect(PG.toSql(select)).toBe(`\
SELECT t1.id AS c1,
       t1.label AS c2,
       t1.hrcdpayq AS c3,
       t2.id AS c4,
       t2.label AS c5
  FROM hltrfv t1
  LEFT JOIN casbwpilgejqgunxera t2 ON t2.id = t1.rgmqgeete
 WHERE t1.hrcdpayq < 0`);
    const response = [
        {
            c1: 123,
            c2: "first",
            c3: 12.3,
            c4: 234,
            c5: "first-first",
        },
        {
            c1: 124,
            c2: "second",
            c3: 23.4,
            c4: 235,
            c5: "second-first",
        },
        {
            c1: 125,
            c2: "third",
            c3: 34.5,
            c4: null,
            c5: null,
        },
    ];
    expect(JSON.parse(JSON.stringify(reader(response)))).toEqual([
        {
            id: 123,
            label: "first",
            hrcdpayq: 12.3,
            rgmqgeete: {
                id: 234,
                label: "first-first",
            },
        },
        {
            id: 124,
            label: "second",
            hrcdpayq: 23.4,
            rgmqgeete: {
                id: 235,
                label: "second-first",
            },
        },
        {
            id: 125,
            label: "third",
            hrcdpayq: 34.5,
            rgmqgeete: null,
        },
    ]);
});

test("Simple reverse query", () => {
    // Setup
    interface IResult {
        id: number;
        label: string;
        eoxfauxk: {
            label: string;
        };
        ircglgzd: {
            id: number;
            label: string;
        };
    }

    const query: JQL.Query<IResult> = {
        $type: "hltrfv",
        id: {},
        label: {},
        eoxfauxk: {
            $type: "eoxfauxk",
            $rev: true,
            $field: "scvkxq",
            label: {},
        },
        ircglgzd: {
            $type: "ircglgzd",
            $rev: true,
            $field: "xtbfolusqqklrxxmr",
            id: {},
            label: {},
        },
    };

    // Execute
    const [select, reader] = SB.toSQL(query);

    // Verify
    expect(PG.toSql(select)).toBe(`\
SELECT t1.id AS c1,
       t1.label AS c2,
       t2.id AS c3,
       t2.label AS c4,
       t3.id AS c5,
       t3.label AS c6
  FROM hltrfv t1
  LEFT JOIN eoxfauxk t2 ON t2.scvkxq = t1.id
  LEFT JOIN ircglgzd t3 ON t3.xtbfolusqqklrxxmr = t1.id`);

    const response = [
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15314,
            c4: "Teh",
            c5: 28894,
            c6: "Niydaljdioldpqcac",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15314,
            c4: "Teh",
            c5: 28905,
            c6: "Zhzodxhkvrurajno",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15314,
            c4: "Teh",
            c5: 34473,
            c6: "Ahzcwmizlcxdbahuz",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15314,
            c4: "Teh",
            c5: 36435,
            c6: "Zkmiukdb",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15884,
            c4: "Kae",
            c5: 28894,
            c6: "Niydaljdioldpqcac",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15884,
            c4: "Kae",
            c5: 28905,
            c6: "Zhzodxhkvrurajno",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15884,
            c4: "Kae",
            c5: 34473,
            c6: "Ahzcwmizlcxdbahuz",
        },
        {
            c1: 22947,
            c2: "Vatjjocbuyji",
            c3: 15884,
            c4: "Kae",
            c5: 36435,
            c6: "Zkmiukdb",
        },
        {
            c1: 23229,
            c2: "Ruwwxf",
            c3: 15764,
            c4: "Yywnrvmnuhxtdoom",
            c5: null,
            c6: null,
        },
        {
            c1: 23230,
            c2: "O",
            c3: null,
            c4: null,
            c5: 28473,
            c6: "Yqcqhjpilgekjkk",
        },
        {
            c1: 23222,
            c2: "Phqhpveuh",
            c3: null,
            c4: null,
            c5: null,
            c6: null,
        },
    ];

    expect(JSON.parse(JSON.stringify(reader(response)))).toEqual([
        {
            id: 22947,
            label: "Vatjjocbuyji",
            eoxfauxk: [
                {
                    id: 15314,
                    label: "Teh",
                },
                {
                    id: 15884,
                    label: "Kae",
                },
            ],
            ircglgzd: [
                {
                    id: 28894,
                    label: "Niydaljdioldpqcac",
                },
                {
                    id: 28905,
                    label: "Zhzodxhkvrurajno",
                },
                {
                    id: 34473,
                    label: "Ahzcwmizlcxdbahuz",
                },
                {
                    id: 36435,
                    label: "Zkmiukdb",
                },
            ],
        },
        {
            id: 23229,
            label: "Ruwwxf",
            eoxfauxk: [
                {
                    id: 15764,
                    label: "Yywnrvmnuhxtdoom",
                },
            ],
            ircglgzd: [],
        },
        {
            id: 23230,
            label: "O",
            eoxfauxk: [],
            ircglgzd: [
                {
                    id: 28473,
                    label: "Yqcqhjpilgekjkk",
                },
            ],
        },
        {
            id: 23222,
            label: "Phqhpveuh",
            eoxfauxk: [],
            ircglgzd: [],
        },
    ]);
});
