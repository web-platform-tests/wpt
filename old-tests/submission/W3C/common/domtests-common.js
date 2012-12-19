function assert_equals_autocase(context, actual, expected) {
    if(context == "attribute") {
	assert_equals(actual.toLowerCase(), expected.toLowerCase());
    } else {
	assert_equals(actual, expected.toUpperCase());
    }
}
  

function assert_equals_collection_autocase(context, actual, expected) {
    //
    //  if they aren't the same size, they aren't equal
    assert_equals(actual.length, expected.length);
    
    //
    //  if there length is the same, then every entry in the expected list
    //     must appear once and only once in the actual list
    var expectedLen = expected.length;
    var expectedValue;
    var actualLen = actual.length;
    var i;
    var j;
    var matches;
    for(i = 0; i < expectedLen; i++) {
        matches = 0;
        expectedValue = expected[i];
        for(j = 0; j < actualLen; j++) {
	    if (context == "attribute") {
		if (expectedValue.toLowerCase() == actual[j].toLowerCase()) {
		    matches++;
		}
	    } else {
		if (expectedValue.toUpperCase() == actual[j]) {
		    matches++;
		}
	    }
        }
        assert_not_equals(matches, 0, "No match found for " + expectedValue);
        if(matches > 1) {
            assert_unreached("Multiple matches found for " + expectedValue);
        }
    }
}

function assert_equals_collection(actual, expected) {
    //
    //  if they aren't the same size, they aren't equal
    assert_equals(actual.length, expected.length);
    //
    //  if there length is the same, then every entry in the expected list
    //     must appear once and only once in the actual list
    var expectedLen = expected.length;
    var expectedValue;
    var actualLen = actual.length;
    var i;
    var j;
    var matches;
    for(i = 0; i < expectedLen; i++) {
        matches = 0;
        expectedValue = expected[i];
        for(j = 0; j < actualLen; j++) {
            if(expectedValue == actual[j]) {
                matches++;
            }
        }
        assert_not_equals(matches, 0, "No match found for " + expectedValue);
        if(matches > 1) {
            assert_unreached("Multiple matches found for " + expectedValue);
        }
    }
}


function assert_equals_list_autocase(context, actual, expected) {
    var minLength = expected.length;
    if (actual.length < minLength) {
	minLength = actual.length;
    }
    //
    for(var i = 0; i < minLength; i++) {
	assert_equals_autocase(context, actual[i], expected[i]);
    }
    //
    //  if they aren't the same size, they aren't equal
    assert_equals(actual.length, expected.length);
}

function assert_equals_list(actual, expected) {
    var minLength = expected.length;
    if (actual.length < minLength) {
	minLength = actual.length;
    }
    //
    for(var i = 0; i < minLength; i++) {
        if(expected[i] != actual[i]) {
	    assert_equals(actual[i], expected[i]);
        }
    }
    //
    //  if they aren't the same size, they aren't equal
    assert_equals(actual.length, expected.length);
}

function assert_same(actual, expected) {
    if(expected != actual) {
        assert_equals(actual.nodeType, expected.nodeType);
        assert_equals(actual.nodeValue, expected.nodeValue);
    }
}

function assert_uri_equals(protocol, path, host, file, name, query, fragment, isAbsolute, actual) {
    //
    //  URI must be non-null
    assert_not_equals(actual, null, "address is defined");

    var uri = actual;

    var lastPound = actual.lastIndexOf("#");
    var actualFragment = "";
    if(lastPound != -1) {
        //
        //   substring before pound
        //
        uri = actual.substring(0,lastPound);
        actualFragment = actual.substring(lastPound+1);
    }
    if(fragment != null) assert_equals(actualFragment, fragment, "proper fragment");

    var lastQuestion = uri.lastIndexOf("?");
    var actualQuery = "";
    if(lastQuestion != -1) {
        //
        //   substring before pound
        //
        uri = actual.substring(0,lastQuestion);
        actualQuery = actual.substring(lastQuestion+1);
    }
    if(query != null) assert_equals(actualQuery, query, "proper query");

    var firstColon = uri.indexOf(":");
    var firstSlash = uri.indexOf("/");
    var actualPath = uri;
    var actualProtocol = "";
    if(firstColon != -1 && firstColon < firstSlash) {
        actualProtocol = uri.substring(0,firstColon+1);
        actualPath = uri.substring(firstColon + 1);
    }

    if(protocol != null) {
        assert_equals(actualProtocol, protocol, "proper protocol");
    }

    if(path != null) {
        assert_equals(actualPath, path, "proper path");
    }

    if(host != null) {
        var actualHost = "";
        if(actualPath.substring(0,2) == "//") {
            var termSlash = actualPath.substring(2).indexOf("/") + 2;
            actualHost = actualPath.substring(2,termSlash);
        }
        assert_equals(actualHost, host, "proper host");
    }

    if(file != null || name != null) {
        var actualFile = actualPath;
        var finalSlash = actualPath.lastIndexOf("/");
        if(finalSlash != -1) {
            actualFile = actualPath.substring(finalSlash+1);
        }
        if (file != null) {
            assert_equals(actualFile, file, "proper file");
        }
        if (name != null) {
            var actualName = actualFile;
            var finalDot = actualFile.lastIndexOf(".");
            if (finalDot != -1) {
                actualName = actualName.substring(0, finalDot);
            }
            assert_equals(actualName, name, "proper name");
        }
    }

    if(isAbsolute != null) {
	if (isAbsolute)
	    assert_equals(actualPath.substring(0,1), "/", "absolute uri");
	else
	    assert_not_equals(actualPath.substring(0,1), "/", "not absolute uri");
    }
}

function equals_autocase(context, actual, expected) {
    if (context == "attribute") {
	return expected.toLowerCase() == actual;
    }
    return expected.toUpperCase() == actual;
}
