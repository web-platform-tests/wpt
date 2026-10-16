// Builds an IdlArray.set_test_filter() predicate from the ?include=<regex> or
// ?exclude=<regex> part of the test URL, for tests that split themselves into
// variants by definition name. The regex is matched against the whole
// definition name. Member names are ignored, so every member of a definition
// is included or excluded along with it.
//
// Usage:
//   idl_array.set_test_filter(subset_idlharness_by_name);
(function() {
  let pattern = null;
  let exclude = false;
  const match = /(?:^\?|&)(include|exclude)=([^&]+)/.exec(location.search);
  if (match) {
    pattern = new RegExp(`^${match[2]}$`);
    exclude = match[1] === 'exclude';
  }

  /**
   * @param {string} name
   * @returns {boolean} Whether tests for the definition should run.
   */
  self.subset_idlharness_by_name = function(name) {
    if (!pattern) {
      return true;
    }
    return pattern.test(name) !== exclude;
  };
})();
