(function() {
  var subTestKeyPattern = null;
  var match;
  var collectKeys = false;
  var collectCounts = false;
  var keys = {};
  var exclude = false;
  var idlMemberPattern = null;
  var excludeMember = false;
  if (location.search) {
    match = /(?:^\?|&)(include|exclude)=([^&]+)?/.exec(location.search);
    if (match) {
      subTestKeyPattern = new RegExp(`^${match[2]}$`);
      if (match[1] === 'exclude') {
        exclude = true;
      }
    }
    let matchIDL = /(?:^\?|&)(includeMember|excludeMember)=([^&]+)?/.exec(location.search);
    if (matchIDL && subTestKeyPattern && !exclude) {
      idlMemberPattern = new RegExp(`^${matchIDL[2]}$`);
      excludeMember = matchIDL[1] === 'excludeMember';
    }
    // Below is utility code to generate <meta> for copy/paste into tests.
    // Sample usage:
    // test.html?get-keys
    match = /(?:^\?|&)get-keys(&get-counts)?(?:&|$)/.exec(location.search);
    if (match) {
      collectKeys = true;
      if (match[1]) {
        collectCounts = true;
      }
      add_completion_callback(() => {
        var metas = [];
        var template = '<meta name="variant" content="?include=%s">';
        if (collectCounts) {
          template += ' <!--%s-->';
        }
        for (var key in keys) {
          var meta = template.replace("%s", key);
          if (collectCounts) {
            meta = meta.replace("%s", keys[key]);
          }
          metas.push(meta);
        }
        var pre = document.createElement('pre');
        pre.textContent = metas.join('\n') + '\n';
        document.body.insertBefore(pre, document.body.firstChild);
        document.getSelection().selectAllChildren(pre);
      });
    }
  }
  /**
   * Check if the test should be excluded according to the
   * arguments specified in the URL.
   * @param {string} key
   * @param {string} idlMemberName
   * @returns {boolean}
   */
  function shouldRunSubTest(key, idlMemberName) {
    return checkByKey(key) && checkIDLMemberName(idlMemberName)
  }

  /**
   * Checks if the test key should be excluded, according
   * to the include= or exclude= query parameters in the URL.
   * @param {string} key
   * @returns {boolean}
   */
  function checkByKey(key) {
    if (key && subTestKeyPattern) {
      var found = subTestKeyPattern.test(key);
      if (exclude) {
        return !found;
      }
      return found;
    }
    return true;
  }
  /**
   * Checks if the idl member should be excluded, according to the
   * includeMember= or excludeMember= URL parameters.
   * @param {string} idlMemberName
   * @returns {boolean}
   */
  function checkIDLMemberName(idlMemberName) {
    if (!idlMemberPattern) {
      return true;
    }
    if (!idlMemberName) {
      return excludeMember
    }
    var found = idlMemberPattern.test(idlMemberName);
    return found != excludeMember;
  }

  /**
   * Only test a subset of tests with `?include=Foo` or `?exclude=Foo` in the URL.
   * Can be used together with `<meta name="variant" content="...">`
   * Sample usage:
   * for (const test of tests) {
   *   subsetTestByKey("Foo", async_test, test.fn, test.name);
   * }
   */
   function subsetTestByKey(key, testFunc, ...args) {
    if (collectKeys) {
      if (collectCounts && key in keys) {
        keys[key]++;
      } else {
        keys[key] = 1;
      }
    }
    if (checkByKey(key)) {
      return testFunc(...args);
    }
    return null;
  }
  self.shouldRunSubTest = shouldRunSubTest;
  self.subsetTestByKey = subsetTestByKey;
})();
