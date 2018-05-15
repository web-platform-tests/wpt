// Only test a subset of tests with, e.g., ?1-10 in the URL
// Sample usage:
// let currentSubTest = 0;
// for (const test of tests) {
//   currentSubTest++;
//   if (shouldRunSubTest(currentSubTest)) {
//     ... run the test ...
//   }
// }
(function() {
  var subTestStart = 0;
  var subTestEnd = Infinity;
  var match;
  if (location.search) {
      match = /^\?(\d+)-(\d+|last)(?:&|$)/.exec(location.search);
      if (match) {
        subTestStart = match[1];
        if (match[2] !== "last") {
            subTestEnd = match[2];
        }
      }
  }
  function shouldRunSubTest(currentSubTest) {
    return currentSubTest >= subTestStart && currentSubTest <= subTestEnd;
  }
  self.shouldRunSubTest = shouldRunSubTest;
})();
