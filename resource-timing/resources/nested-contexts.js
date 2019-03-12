const pre_navigate_url = new URL("/resource-timing/resources/document-that-navigates.html", location).href;
const post_navigate_url = new URL("/resource-timing/resources/document-navigated.html", location).href;
const pre_refresh_url = new URL("/resource-timing/resources/document-that-refreshes.html", location).href;
const post_refresh_url = new URL("/resource-timing/resources/document-refreshed.html", location).href;

function setup_navigate_or_refresh(t, type, pre, post) {
    function verify_document_navigate_not_observable() {
        let entries = performance.getEntriesByType("resource");
        let found_first_document = false;
        for (entry of entries) {
            if (entry.name == pre) {
                found_first_document = true;
            }
            assert_not_equals(entry.name, post, type + " document should not be observable");
        }
        assert_true(found_first_document, "Initial document should be observable");
        t.done();
    }
    window.addEventListener("message", t.step_func(e=>{
        if (e.data == type) {
            verify_document_navigate_not_observable();
        }
    }));

}

function setup_navigate_test(t) {
    setup_navigate_or_refresh(t, "navigated", pre_navigate_url, post_navigate_url);
}

function setup_refresh_test(t) {
    setup_navigate_or_refresh(t, "refreshed", pre_refresh_url, post_refresh_url);
}

function setup_back_navigation(pushed_url) {
    function verify_document_navigate_not_observable() {
        let entries = performance.getEntriesByType("resource");
        let found_first_document = false;
        for (entry of entries) {
            if (entry.name == pre_navigate_url) {
                found_first_document = true;
            }
            if (entry.name == post_navigate_url) {
                opener.postMessage("FAIL - navigated document exposed", "*");
                return;
            }
        }
        if (!found_first_document) {
            opener.postMessage("FAIL - first document not exposed", "*");
            return;
        }
        opener.postMessage("PASS", "*");
    }
    window.addEventListener("message", e=>{
        if (e.data == "navigated") {
            if (sessionStorage.navigated) {
                delete sessionStorage.navigated;
                verify_document_navigate_not_observable();
            } else {
                sessionStorage.navigated = true;
                setTimeout(() => {
                    history.pushState({}, "", pushed_url);
                    location.href="navigate_back.html";
                }, 0);
            }
        }
    });
}
