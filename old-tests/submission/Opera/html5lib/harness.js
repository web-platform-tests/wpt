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

function run_tests(file_names, filters, min_index, max_index, run_type, show_progress) {
  run_type = run_type ? run_type : "uri";

  var counter = 0;

  function on_result(test) {
    var test_id = test.name.split(" ")[1];
    process_result(test_id, test);
    if (show_progress) {
      display_progress(test_id, test);
    }
  }

  function display_progress(test_id, test) {
    set_status((counter++) + " " + test.name);
    var progress_node = document.createElement("a");
    progress_node.href = current_file + "#" + test_id;
    var status_strings = {};
    status_strings[test.PASS] = ". ";
    status_strings[test.FAIL] = "F ";
    status_strings[test.TIMEOUT] = "T ";
    status_strings[test.NOTRUN] = "N ";

    var progress_text = document.createTextNode(status_strings.hasOwnProperty(test.status) ? status_strings[test.status] : "? ");
    progress_node.appendChild(progress_text);
    document.getElementById("progress").appendChild(progress_node);
  }

  function on_file_complete(tests) {
    try {
      make_details();
      if (tests_remaining.length > 0 && done === false) {
        setTimeout(run_next, 0);
      } else {
        make_summary();
      }
    } catch(e) {
      alert(e);
    }
  };
  window.result_callback = on_result;
  window.completion_callback = on_file_complete;

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
  var test_iframe = document.getElementById("test_frame");
  var pass_count = 0;
  var fail_count = 0;
  var current_file = null;
  var file_fails = null;

  function run_next() {
    if (test_iframe === null) {
      test_iframe = document.createElement("iframe");
      test_iframe.style.display = "none";
      test_iframe.id = "test_frame";
      document.body.appendChild(test_iframe);
    }
    var src = tests_remaining.shift();
    src += (src.indexOf("?") === -1)?"?":"&";
    src += "run_type=" + run_type;
    current_file = src;
    file_fails = [];
    test_iframe.src = src;
  }

  function process_result(test_id, test) {
    if (test.status !== test.PASS) {
      fail_count++;
      file_fails.push({test_id:test_id, path:current_file});
    } else {
      pass_count++;
    }
  };

  function make_summary() {
    var status = "Ran " + (pass_count + fail_count) + " tests in " + Math.round((new Date() - start_time)/1000.) + "s, " + pass_count + " passed " + fail_count + " failed";
    set_status(status);
  }

  function make_details() {
    var details = document.getElementById("details");

    var template = ["div", {"class":"result_detail"},
		    ["div", {"class":"input"},
		     ["h3", {}, "Input"],
		     ["pre", {},
		      ["code", {}, "${input}"]]],
                    function(vars) {
                      if (vars.container !== null) {
                        return ["div", {"class":"container"},
                                ["h3", {}, "innerHTML Container"],
                                ["pre", {}, vars.container]];
                      } else {
                        return null;
                      }
                    },
		    ["div", {"class":"expected"},
		     ["h3", {}, "Expected"],
		     ["pre", {},
		      "${expected}"]],
		    ["div", {"class":"actual"},
		     ["h3", {}, "Actual"],
		     ["pre", {},
		      "${actual}"]],
                    ["a", {href:"${path}"}, "${path}"],
                    ["hr", {}]
		   ];

    file_fails.forEach(function(test_data) {
                         var test_id = test_data.test_id;
                         var doc = test_iframe.contentDocument;
                         var input = doc.querySelector("#input_" + test_id + " > pre > code").textContent;
                         var expected = doc.querySelector("#expected_" + test_id + " > pre > code").textContent;
                         var innerHTML_element = doc.querySelector("#container_" + test_id + " > pre > code");
                         var container = innerHTML_element ? innerHTML_element.textContent : null;
                         var actual = doc.querySelector("#actual_" + test_id +
                                                        " > pre > code").textContent;

		         var diffs = mark_diffs(expected, actual);
		         var node = window.template.render(template,
                         {path:test_data.path,
                          container:container,
			  input:input,
			  expected:diffs[0],
			  actual:diffs[1]}
			 );
		         details.appendChild(node);
		       });
  };

  run_next();
}