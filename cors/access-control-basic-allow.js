var accessControlBasicAllow = function() {
    var xhr = new XMLHttpRequest;
    var path = "/webappsec/tests/cors/submitted/webkit";

    try {
        xhr.open("GET", "http://www1.w3c-test.org" + path + "/resources/access-control-basic-allow.php", false);

    } catch(e) {
        log("FAIL: Exception thrown. Cross-domain access is not allowed in 'open'. [" + e.message + "].");
        assert_true(false);
        return;
    }

    try {
        xhr.send();
        console.log(xhr.responseText);
        assert_equals(xhr.responseText,"PASS: Cross-domain access allowed.", "test for cross domain" );
    } catch(e) {
        log("FAIL: Exception thrown. Cross-domain access is not allowed in 'send'. [" + e.message + "].");
        assert_true(false);
        return;
    }

    //log(xhr.responseText);
};

test(accessControlBasicAllow, "access-control-basic-allow")

