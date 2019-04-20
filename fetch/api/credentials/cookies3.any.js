// META: script=../resources/utils.js
'use strict';

var index = -1;

while (index++ < 10) {
  (function(name) {
    promise_test(function(t) {
      var url = RESOURCES_DIR + 'top.txt'
      var setUrl = url + '?pipe=header(Set-Cookie,' + name + '=1,True)|header(Vary,*)';
      var unsetUrl = url + '?pipe=header(Set-Cookie,' + name + '=0%3B%20max-age=0,True)|header(Vary,*)';
      var getUrl = RESOURCES_DIR + 'inspect-headers.py?headers=cookie';
      var opts = { credentials: 'include' };

      t.add_cleanup(function() {
        return fetch(unsetUrl, opts);
      });

      return fetch(setUrl)
        .then(function() {
            return fetch(getUrl, opts);
          })
        .then(function(response) {
            assert_equals(response.headers.get('x-request-cookie'), name + '=1', 'first set');
            return fetch(unsetUrl, opts);
          })
        .then(function() {
            return fetch(getUrl, opts);
          })
        .then(function(response) {
            assert_equals(response.headers.get('x-request-cookie'), null, 'first unset');
          });
    }, name);
  })(String.fromCharCode(97 + index));
}
