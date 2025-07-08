test(t => {
    localStorage.clear();

    var index = 0;
    var key = "name";
    var val = "x".repeat(1024);

    t.add_cleanup(() => {
        localStorage.clear();
    });

    try {
        while (true) {
            index++;
            localStorage.setItem("" + key + index, "" + val + index);
        }
    } catch (e) {
        assert_equals(e.constructor, globalThis.QuotaExceededError, "QuotaExceededError constructor match");
        assert_equals(e.quota, null, "quota");
        assert_equals(e.requested, null, "requested");
    }

}, "Throws QuotaExceededError when the quota has been exceeded");
