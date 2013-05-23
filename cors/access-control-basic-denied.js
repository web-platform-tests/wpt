var accessControlBasicDenied = function() {
    var xhr = new XMLHttpRequest;
    var path = "/webappsec/tests/cors/submitted/webkit";

    try {
        xhr.open("GET", "http://www1.w3c-test.org" + path + "/resources/access-control-basic-denied.php", false);
    } catch(e) {
        log("FAIL: Exception thrown. Cross-domain access is not allowed in 'open'. [" + e.message + "].");
        assert_true(false);
        return;
    }

    try {
        xhr.send();
        assert_true(false);
    } catch(e) {
        assert_true(true);
        //log("PASS: Exception thrown. Cross-domain access was denied in 'send'. [" + e.message + "].");
        return;
    }

    log(xhr.responseText);
};

test(accessControlBasicDenied, "access-control-basic-denied")
