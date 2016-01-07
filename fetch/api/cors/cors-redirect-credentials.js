if (this.document === undefined) {
  importScripts("/resources/testharness.js");
  importScripts("../resources/utils.js");
}

function corsRedirectCreds(desc, redirectUrl, redirectLocation, redirectStatus, LocationCreds) {

  var url = redirectUrl
  var urlParameters = "?redirect_status=" + redirectStatus;
  urlParameters += "&location=" + encodeURIComponent(redirectLocation.replace("://", "://" + LocationCreds + "@"));

  var requestInit = {"mode": "cors", "redirect": "follow", "credentials":"include"};

  promise_test(function(test) {
    return promise_rejects(test, new TypeError(), fetch(url + urlParameters, requestInit));
  }, desc);
}

var redirPath = dirname(location.pathname) + RESOURCES_DIR + "redirect.py";
var preflightPath = dirname(location.pathname) + RESOURCES_DIR + "preflight.py";

var localRedirect = "http://{{host}}:{{ports[http][0]}}" + redirPath;
var remoteRedirect = "http://www1.{{host}}:{{ports[http][0]}}" + redirPath;

var localLocation = "http://{{host}}:{{ports[http][0]}}" + preflightPath;
var remoteLocation = "http://www1.{{host}}:{{ports[http][0]}}" + preflightPath;
var remoteLocation2 = "http://www.{{host}}:{{ports[http][0]}}" + preflightPath;

for (var code of [301, 302, 303, 307, 308]) {
  corsRedirectCreds("Redirect " + code + " from same origin to remote with user and password", localRedirect, remoteLocation, code, "user:password");
  corsRedirectCreds("Redirect " + code + " from same origin to remote with user", localRedirect, remoteLocation, code, "user:");
  corsRedirectCreds("Redirect " + code + " from same origin to remote with password", localRedirect, remoteLocation, code, ":password");

  corsRedirectCreds("Redirect " + code + " from remote to same origin with user and password", remoteRedirect, localLocation, code, "user:password");
  corsRedirectCreds("Redirect " + code + " from remote to same origin with user", remoteRedirect, localLocation, code, "user:");
  corsRedirectCreds("Redirect " + code + " from remote to same origin with password", remoteRedirect, localLocation, code, ":password");

  corsRedirectCreds("Redirect " + code + " from remote to another remote with user and password", remoteRedirect, remoteLocation2, code, "user:password");
  corsRedirectCreds("Redirect " + code + " from remote to another remote with user", remoteRedirect, remoteLocation2, code, "user:");
  corsRedirectCreds("Redirect " + code + " from remote to another remote with password", remoteRedirect, remoteLocation2, code, ":password");

  corsRedirectCreds("Redirect " + code + " from remote to same remote with user and password", remoteRedirect, remoteLocation, code, "user:password");
  corsRedirectCreds("Redirect " + code + " from remote to same remote with user", remoteRedirect, remoteLocation, code, "user:");
  corsRedirectCreds("Redirect " + code + " from remote to same remote with password", remoteRedirect, remoteLocation, code, ":password");
}

done();
