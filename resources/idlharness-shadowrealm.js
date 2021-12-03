// TODO: it would be nice to support `idl_array.add_objects`
/**
 * idl_test_shadowrealm is a promise_test wrapper that handles the fetching of the IDL, and
 * running the code in a `ShadowRealm`, avoiding repetitive boilerplate.
 *
 * @see https://github.com/tc39/proposal-shadowrealm
 * @param {String[]} srcs Spec name(s) for source idl files (fetched from
 *      /interfaces/{name}.idl).
 * @param {String[]} deps Spec name(s) for dependency idl files (fetched
 *      from /interfaces/{name}.idl). Order is important - dependencies from
 *      each source will only be included if they're already know to be a
 *      dependency (i.e. have already been seen).
 */
function idl_test_shadowrealm(srcs, deps) {
    const script_urls = [
        "/resources/testharness.js",
        "/resources/WebIDLParser.js",
        "/resources/idlharness.js",
    ];
    promise_test(t => {
        const realm = new ShadowRealm();
        realm.evaluate("globalThis.self = globalThis; undefined");

        return Promise.all(script_urls.map(url => fetch_text(url)))
        .then(ss => {
            for (const s of ss) {
                realm.evaluate(s);
            }
        })
        .then(_ => Promise.all(srcs.concat(deps).map(fetch_spec)))
        .then(specs => {
            const idls = JSON.stringify(specs.map(i => i.idl));
            const code = `
                const idls = ${idls};
                let results;
                add_completion_callback(function (tests, harness_status, asserts_run) {
                    results = tests;
                });

                // Without the wrapping test, testharness.js will think it's done after it has run
                // the first idlharness test.
                test(() => {
                    const idl_array = new IdlArray();
                    for (let i = 0; i < ${srcs.length}; i++) {
                        idl_array.add_idls(idls[i]);
                    }
                    for (let i = ${srcs.length}; i < ${srcs.length + deps.length}; i++) {
                        idl_array.add_dependency_idls(idls[i]);
                    }
                    idl_array.test();
                }, "inner setup");
                String(JSON.stringify(results))
            `;

            // We ran the tests in the ShadowRealm and gathered the results. Now treat them as if
            // we'd run them directly here, so we can see them.
            const results = JSON.parse(realm.evaluate(code));
            for (const {name, status, message} of results) {
                // TODO: make this an API in testharness.js - needs RFC?
                async_test(t => {t.set_status(status, message); t.phase = t.phases.HAS_RESULT; t.done()}, name);
            }
        });
    }, "outer setup");
}

function fetch_text(url) {
    return fetch(url).then(function (r) {
        if (!r.ok) {
            throw new IdlHarnessError("Error fetching " + url + ".");
        }
        return r.text();
    });
}

/**
 * fetch_spec is a shorthand for a Promise that fetches the spec's content.
 */
function fetch_spec(spec) {
    var url = '/interfaces/' + spec + '.idl';
    return fetch_text(url).then(idl => ({ spec, idl }));
}
// vim: set expandtab shiftwidth=4 tabstop=4 foldmarker=@{,@} foldmethod=marker:
