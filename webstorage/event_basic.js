async_test(function(t) {
    var name ;
    testStorages(t.step_func(runTest));

    function runTest(storageString, callback)
    {
        name = storageString;
        window.completionCallback = function() { t.done(); };

        assert_true(storageString in window, storageString + " exist");
        window.storage = eval(storageString);

        storageEventList = new Array();
        storage.clear();
        assert_equals(storage.length, 0, "storage.length");

        runAfterNStorageEvents(t.step_func(step1), 0);
    }

    function step1(msg)
    {
        storageEventList = new Array();
        storage.setItem('FOO', 'BAR');

        runAfterNStorageEvents(t.step_func(step2), 1);
    }

    function shouldBeEqualToString(express, expectValue) {
        assert_equals(typeof express, "string");
        assert_equals(express, expectValue);
    }

    function step2(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 1);
        shouldBeEqualToString(storageEventList[0].key, "FOO");
        assert_equals(storageEventList[0].oldValue, null);
        shouldBeEqualToString(storageEventList[0].newValue, "BAR");

        storage.setItem('FU', 'BAR');
        storage.setItem('a', '1');
        storage.setItem('b', '2');
        storage.setItem('b', '3');

        runAfterNStorageEvents(t.step_func(step3), 5);
    }

    function step3(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 5);
        shouldBeEqualToString(storageEventList[1].key, "FU");
        assert_equals(storageEventList[1].oldValue, null);
        shouldBeEqualToString(storageEventList[1].newValue, "BAR");

        shouldBeEqualToString(storageEventList[2].key, "a");
        assert_equals(storageEventList[2].oldValue, null);
        shouldBeEqualToString(storageEventList[2].newValue, "1");

        shouldBeEqualToString(storageEventList[3].key, "b");
        assert_equals(storageEventList[3].oldValue, null);
        shouldBeEqualToString(storageEventList[3].newValue, "2");

        shouldBeEqualToString(storageEventList[4].key, "b");
        shouldBeEqualToString(storageEventList[4].oldValue, "2");
        shouldBeEqualToString(storageEventList[4].newValue, "3");

        storage.removeItem('FOO');

        runAfterNStorageEvents(t.step_func(step4), 6);
    }

    function step4(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 6);
        shouldBeEqualToString(storageEventList[5].key, "FOO");
        shouldBeEqualToString(storageEventList[5].oldValue, "BAR");
        assert_equals(storageEventList[5].newValue, null);

        storage.removeItem('FU');

        runAfterNStorageEvents(t.step_func(step5), 7);
    }

    function step5(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 7);
        shouldBeEqualToString(storageEventList[6].key, "FU");
        shouldBeEqualToString(storageEventList[6].oldValue, "BAR");
        assert_equals(storageEventList[6].newValue, null);

        storage.clear();

        runAfterNStorageEvents(t.step_func(step6), 8);
    }

    function step6(msg)
    {
        if(msg != undefined) {
            assert_unreached(msg);
        }
        assert_equals(storageEventList.length, 8);
        assert_equals(storageEventList[7].key, null);
        assert_equals(storageEventList[7].oldValue, null);
        assert_equals(storageEventList[7].newValue, null);

        completionCallback();
    }

}, "DOM Storage mutations fire StorageEvents that are caught by the event listener set via window.onstorage.");
