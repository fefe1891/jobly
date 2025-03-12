const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", () => {
    // Helper function to run the test and check the result
    const runTest = (data, fieldMap, expected) => {
        const result = sqlForPartialUpdate(data, fieldMap);
        expect(result).toEqual(expected);
    };

    test("works: 1 item", () => {
        runTest(
            { f1: "v1" },
            { f1: "f1", fF2: "f2" },
            {
                setCols: "\"f1\"=$1",
                values: ["v1"],
            }
        );
    });

    test("works: 2 items", () => {
        runTest(
            { f1: "v1", jsF2: "v2" },
            { jsF2: "f2" },
            {
                setCols: "\"f1\"=$1, \"f2\"=$2",
                values: ["v1", "v2"],
            }
        );
    });
});