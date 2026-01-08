// META: script=support-promises.js

const DB_NAME = databaseName("");

const STORE = "store";

// In the original bug tickled by this test case, only two of the
// queries worked and the rest stalled! Do five iterations and keep
// count to make sure that they do all succeed. Note that we don't
// need any assertions in this test - if all the queries complete, we
// pass!
//
// See <https://github.com/dumbmatter/fakeIndexedDB/issues/26> for the
// original bug.
const ITERATIONS = 5;

const t = async_test("removeEventListener in a handler doesn't interfere with future transactions.");

t.add_cleanup(() => {
    indexedDB.deleteDatabase(DB_NAME);
})

let count = 0;

const go = () => {
    const dbReq = indexedDB.open(DB_NAME, 1);
    dbReq.addEventListener("upgradeneeded", t.step_func((ev) => {
        ev.target.result.createObjectStore(STORE);
    }));
    dbReq.addEventListener("success", t.step_func((ev) => {
        const db = ev.target.result
        const tx = db.transaction(STORE, "readwrite");
        const complete = t.step_func(() => {
            tx.removeEventListener('complete', complete);
        });
        tx.addEventListener('complete', complete);
        const store = tx.objectStore(STORE);
        store.get(0).addEventListener("success", t.step_func(() => {
            count += 1;
            if (count === ITERATIONS) {
                t.done();
            }
        }));
    }));
};

for (let i = 0; i < ITERATIONS; i++) {
    go();
}
