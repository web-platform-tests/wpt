var accessControlBasicAllowAccessControlOriginHeader = function() {
    var xhr = new XMLHttpRequest;
    var path = "/webappsec/tests/cors/submitted/webkit";

    try {
        xhr.open("GET", "http://www1.w3c-test.org" + path + "/resources/access-control-basic-allow-access-control-origin-header.php", false);
    } catch(e) {
        log("FAIL: Exception thrown. Cross-domain access is not allowed in 'open'. [" + e.message + "].");
        assert_true(false);
        return;
    }

    try {
        xhr.send();
	assert_true(true);
    } catch(e) {
        log("FAIL: Exception thrown. Cross-domain access is not allowed in 'send'. [" + e.message + "].");
        assert_true(false);
        return;
    }

    //log(xhr.responseText);
};

test(accessControlBasicAllowAccessControlOriginHeader, "access-control-basic-allow-access-control-origin-header")
