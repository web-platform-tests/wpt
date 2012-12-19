function clear() {
  set_status("");
  var progress =
  ["progress", "details"].forEach(function(x) {
                                    var old_node = document.getElementById(x);
                                    var new_node = old_node.cloneNode(false);
                                    old_node.parentNode.replaceChild(new_node, old_node);
                                  });
}

function set_status(text) {
  var status = document.getElementById("status");
  status.textContent = text;
}

var done;

function run_tests(file_names, filters, min_index, max_index) {
  function on_result(tests) {
    var passed = tests[0].status === 0;
    process_result(passed);
    if (tests_remaining.length > 0 && done === false) {
      setTimeout(run_next, 0);
    } else {
      setTimeout(function() {make_summary();}, 0);
    }
  };
  window.completion_callback = on_result;

  done = false;
  var start_time = new Date();
  var tests_remaining;
  if (filters.length > 0) {
    tests_remaining = file_names.filter(function(test) {
                                          return filters.every(function(filter) {
                                                                 filter.lastIndex = 0;
                                                                 var rv = filter.test(test);
                                                                 return rv;
                                                               });
                                             });
  } else {
    tests_remaining = file_names;
  }
  tests_remaining = tests_remaining.slice(min_index, max_index);
  var test_iframe = null;
  var tests_run = [];
  var current_test = null;

  var counter = 0;
  function run_next() {
    if (test_iframe !== null) {
      document.body.removeChild(test_iframe);
    }

    test_iframe = document.createElement("iframe");
    test_iframe.style.display = "None";
    document.body.appendChild(test_iframe);
    current_test = tests_remaining.shift();
    set_status(counter++ + " " + current_test);
    test_iframe.src = current_test;
  }

  function process_result(passed) {
    var doc = test_iframe.contentDocument;
    var progress_node = document.createElement("a");
    progress_node.href = current_test;
    var progress_text = document.createTextNode(passed ? ". " : "F ");
    progress_node.appendChild(progress_text);
    document.getElementById("progress").appendChild(progress_node);
    tests_run.push({test:current_test, passed:passed});
  };

  function make_summary() {
    var passes = tests_run.filter(function(x){return x.passed;});
    var fails = tests_run.filter(function(x){return !x.passed;});
    var status = "Ran " + tests_run.length + " tests in " + Math.round((new Date() - start_time)/1000.) + "s, " + passes.length + " passed " + fails.length + " failed";
    set_status(status);
  }

  run_next();

}