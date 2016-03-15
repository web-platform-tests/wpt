var inWorker = false;
var RESOURCES_DIR = "../resources/";

try {
  inWorker = !(self instanceof Window);
} catch (e) {
  inWorker = true;
}

function dirname(path) {
    return path.replace(/\/[^\/]*$/, '/')
}

function checkRequest(request, ExpectedValuesDict) {
  for (var attribute in ExpectedValuesDict) {
    switch(attribute) {
      case "headers":
        for (var key in ExpectedValuesDict["headers"].keys()) {
          assert_equals(request["headers"].get(key), ExpectedValuesDict["headers"].get(key),
            "Check headers attribute has " + key + ":" + ExpectedValuesDict["headers"].get(key));
        }
        break;

      case "body":
        //for checking body's content, a dedicated asyncronous/promise test should be used
        assert_true(request["headers"].has("Content-Type") , "Check request has body using Content-Type header")
        break;

      case "method":
      case "referrer":
      case "referrerPolicy":
      case "credentials":
      case "cache":
      case "redirect":
      case "integrity":
      case "url":
      case "destination":
        assert_equals(request[attribute], ExpectedValuesDict[attribute], "Check " + attribute + " attribute")
        break;

      default:
        break;
    }
  }
}

// Taken from https://developers.google.com
function stringToArrayBuffer(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

//check reader's text content in an asyncronous test
function readTextStream(reader, asyncTest, expectedValue, retrievedArrayBuffer) {
  reader.read().then(function(data) {
    if (!data.done) {
      var newBuffer;
      if (retrievedArrayBuffer) {
        newBuffer =  new ArrayBuffer(data.value.length + retrievedArrayBuffer.length);
        newBuffer.set(retrievedArrayBuffer, 0);
        newBuffer.set(data.value, retrievedArrayBuffer.length);
      } else {
        newBuffer = data.value;
      }
      readTextStream(reader, asyncTest, expectedValue, newBuffer);
      return;
    }
    asyncTest.step(function() {
      assert_array_equals(retrievedArrayBuffer, stringToArrayBuffer(expectedValue), "Retrieve and verify stream");
      asyncTest.done();
    });
  }).catch(function(e) {
    asyncTest.step(function() {
      assert_unreached("Cannot read stream " + e);
      asyncTest.done();
    });
  });
}
