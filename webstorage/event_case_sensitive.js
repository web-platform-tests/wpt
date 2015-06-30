async_test(function(t) {
    testStorages(t.step_func(runTest));

    function runTest(storageString, callback)
    {
        assert_true(storageString in window, storageString + " exist");
        window.storage = eval(storageString);

        storage.clear();
        assert_equals(storage.length, 0, "storage.length");
        storage.foo = "test";

        runAfterNStorageEvents(t.step_func(step1), 1);
    }

    function step1(msg)
    {
        storageEventList = new Array();
        storage.foo = "test";

        runAfterNStorageEvents(t.step_func(step2), 0);
    }

    function step2(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 0);

        storage.foo = "TEST";

        runAfterNStorageEvents(t.step_func(step3), 1);
    }

    function step3(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 1);

        t.done();
    }
}, "storage events fire even when only the case of the value changes.");
