// Only test a subset of tests with ?include=Foo or ?exclude=Foo in the URL.
// Can be used together with <meta name="variant" content="...">
// Sample usage:
// for (const test of tests) {
//   subsetTestByName("Foo", async_test, test.fn, test.name);
// }
(function() {
  var subTestNamePattern = null;
  var match;
  var collectNames = false;
  var collectCounts = false;
  var names = {};
  var exclude = false;
  if (location.search) {
    match = /(?:^\?|&)(include|exclude)=([^&]+)?/.exec(location.search);
    if (match) {
      subTestNamePattern = new RegExp(`^${match[2]}$`);
      if (match[1] === 'exclude') {
        exclude = true;
      }
    }
    // Below is utility code to generate <meta> for copy/paste into tests.
    // Sample usage:
    // test.html?get-names
    match = /(?:^\?|&)get-names(&get-counts)?(?:&|$)/.exec(location.search);
    if (match) {
      collectNames = true;
      if (match[1]) {
        collectCounts = true;
      }
      add_completion_callback(() => {
        var metas = [];
        var template = '<meta name="variant" content="?include=%s">';
        if (collectCounts) {
          template += ' <!--%s-->';
        }
        for (var name in names) {
          var meta = template.replace("%s", name);
          if (collectCounts) {
            meta = meta.replace("%s", names[name]);
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
  function shouldRunSubTest(name) {
    if (name && subTestNamePattern) {
      var found = subTestNamePattern.test(name);
      if (exclude) {
        return !found;
      }
      return found;
    }
    return true;
  }
  function subsetTestByName(name, testFunc, ...args) {
    if (collectNames) {
      if (collectCounts && name in names) {
        names[name]++;
      } else {
        names[name] = 1;
      }
    }
    if (shouldRunSubTest(name)) {
      return testFunc(...args);
    }
    return null;
  }
  self.shouldRunSubTest = shouldRunSubTest;
  self.subsetTestByName = subsetTestByName;
})();
