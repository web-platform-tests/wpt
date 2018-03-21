/**
 * Runs a collection of tests that determine if an API implements structured clone
 * correctly.
 *
 * The `runner` parameter has the following properties:
 * - `setup()`: An optional function run once before testing starts
 * - `teardown()`: An option function run once after all tests are done
 * - `preTest()`: An optional, async function run before a test
 * - `postTest()`: An optional, async function run after a test is done
 * - `structuredClone(obj)`: Required function that somehow structurally clones
 *                               an object.
 */
async function structuredCloneBatteryOfTests(runner) {
  const tests = [
    {
      description: "structuredClone returns a structural clone of an object",
      async f(runner) {
        const obj = {
          a: 1,
          b: {
            a: 1,
            b: [2, 3, 4]
          },
          c: [7, 8, 9]
        };
        const copy = await runner.structuredClone(obj);
        assert_equals(JSON.stringify(obj), JSON.stringify(copy));
        assert_true(copy !== obj);
      }
    },
    {
      description: "structuredClone handles primitives",
      async f(runner) {
        const copy = await runner.structuredClone(4);
        assert_equals(copy, 4);
      }
    }
  ]
  const defaultRunner = {
    setup() {},
    preTest() {},
    postTest() {},
    teardown() {}
  };
  runner = Object.assign({}, defaultRunner, runner);

  await runner.setup();
  const allTests = tests.map((test, id) => {
    return new Promise(resolve => {
      promise_test(async _ => {
        await runner.preTest(test);
        await test.f(runner)
        await runner.postTest(test);
        resolve();
      }, test.description);
    }).catch(_ => {});
  });
  await Promise.all(allTests);
  await runner.teardown();
}
