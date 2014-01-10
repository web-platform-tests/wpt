(function() {
"use strict";
var runner;

function Manifest(path) {
    this.data = null;
    this.path = path
    this.num_tests = null;
}

Manifest.prototype = {
    load: function(loaded_callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = (function() {
            if (xhr.readyState !== 4) {
                return;
            }
            if (!(xhr.status === 200 || xhr.status === 0)) {
                throw new Error("Manifest " + this.path + " failed to load");
            }
            this.data = JSON.parse(xhr.responseText);
            loaded_callback();
        }).bind(this);
        xhr.open("GET", this.path);
        xhr.send(null);
    },

    by_type:function(type) {
        if (this.data.items.hasOwnProperty(type)) {
            return this.data.items[type];
        } else {
            return [];
        }
    }
}

function ManifestIterator(manifest, path, test_types) {
    this.manifest = manifest;
    this.path = path;
    this.test_types = test_types;
    this.test_types_index = -1;
    this.test_list = null;
    this.test_index = null;
}

ManifestIterator.prototype = {
    next: function() {
        if (this.test_types.length === 0) {
            return null;
        }

        while (this.test_list === null || this.test_index === this.test_list.length) {
            this.test_types_index++;
            if (this.test_types_index >= this.test_types.length) {
                return null;
            }
            this.test_index = 0;
            this.test_list = this.manifest.by_type(this.test_types[this.test_types_index]);
        }
        var manifest_item = this.test_list[this.test_index++];
        while (manifest_item && !this.matches(manifest_item)) {
            manifest_item = this.test_list[this.test_index++];
        }
        if (!manifest_item) {
            return null;
        }
        return this.to_test(manifest_item)
    },

    matches: function(manifest_item) {
        return manifest_item.url.indexOf(this.path) == 0;
    },

    to_test: function(manifest_item) {
        var test = {
            type: this.test_types[this.test_types_index],
            url: manifest_item.url
        };
        if (manifest_item.hasOwnProperty("ref_url")) {
            test.ref_type = manifest_item.ref_type;
            test.ref_url = manifest_item.ref_url;
        }
        return test;
    },

    count: function() {
        return this.test_types.reduce((function(prev, current) {
            var matches = this.manifest.by_type(current).filter((function(x) {
                return this.matches(x);
            }).bind(this));
            return prev + matches.length;
        }).bind(this), 0);
    }
}

function VisualOutput(elem, runner) {
    this.elem = elem;
    this.runner = runner;
    this.meter = null;
    this.results_table = null;
    this.section_wrapper = null;
    this.results_table = this.elem.querySelector(".results > table");
    this.section = null;
    this.progress = this.elem.querySelector(".summary .progress");
    this.result_count = null;

    this.elem.style.display = "none";
    this.runner.start_callbacks.push(this.on_start.bind(this));
    this.runner.result_callbacks.push(this.on_result.bind(this));
    this.runner.done_callbacks.push(this.on_done.bind(this));
}

VisualOutput.prototype = {
    clear: function() {
        this.result_count = {"PASS":0,
                             "FAIL":0,
                             "ERROR":0,
                             "TIMEOUT":0}
        while (this.progress.childNodes.length) {
            this.progress.removeChild(this.progress.childNodes[0]);
        }
        for (var p in this.result_count) {
            if (this.result_count.hasOwnProperty(p)) {
                this.elem.querySelector("dd." + p).textContent = 0;
            }
        }
        this.elem.querySelector(".jsonResults").textContent = "";
        this.results_table.removeChild(this.results_table.tBodies[0]);
        this.results_table.appendChild(document.createElement("tbody"));
    },

    on_start: function() {
        this.clear();
        this.meter = document.createElement("meter");
        this.progress.appendChild(this.meter);
        this.elem.style.display = "block";
    },

    on_result: function(test, status, message, subtests) {
        var row = document.createElement("tr");

        var subtest_pass_count = subtests.reduce(function(prev, current) {
            return (current.status === "PASS") ? prev + 1 : prev;
        }, 0);
        var subtests_count = subtests.length;

        var test_status;
        if (subtest_pass_count === subtests_count &&
            (status == "OK" || status == "PASS")) {
            test_status = "PASS"
        } else if (subtests_count > 0 && status === "OK") {
            test_status = "FAIL";
        } else {
            test_status = status;
        }

        subtests.forEach((function(subtest) {
            if (this.result_count.hasOwnProperty(subtest.status)) {
                this.result_count[subtest.status] += 1;
            }
        }).bind(this));
        if (this.result_count.hasOwnProperty(status)) {
            this.result_count[status] += 1;
        }

        var name_node = row.appendChild(document.createElement("td"));
        name_node.appendChild(this.test_name_node(test));

        var status_node = row.appendChild(document.createElement("td"));
        status_node.textContent = test_status;
        status_node.className = test_status;

        var message_node = row.appendChild(document.createElement("td"));
        message_node.textContent = message || "";

        var subtests_node = row.appendChild(document.createElement("td"));
        if (subtests_count) {
            subtests_node.textContent = subtest_pass_count + "/" + subtests_count;
        } else {
            subtests_node.textContent = "1/1"
        }

        this.elem.querySelector("dd." + test_status).textContent = this.result_count[test_status];

        this.results_table.tBodies[0].appendChild(row);
        this.update_meter(this.runner.progress());
    },

    on_done: function() {
        this.meter.parentNode.removeChild(this.meter);
        this.meter = null;
        this.progress.textContent = "Done";
        //add the json serialization of the results
        var a = this.elem.querySelector(".jsonResults");
        //Using a json content type here causes browsers to freeze/crash
        a.href = "data:text/plain," + encodeURIComponent(this.runner.results.to_json());
        a.textContent = "JSON Results...";
    },

    test_name_node: function(test) {
        if (!test.hasOwnProperty("ref_url")) {
            return this.link(test.url);
        } else {
            var wrapper = document.createElement("span");
            wrapper.appendChild(this.link(test.url));
            wrapper.appendChild(document.createTextNode(" " + test.ref_type + " "));
            wrapper.appendChild(this.link(test.ref_url));
            return wrapper;
        }
    },

    link: function(href) {
        var link = document.createElement("a");
        link.href = this.runner.server + href;
        link.textContent = href;
        return link;
    },

    update_meter: function(progress) {
        this.meter.value = progress;
        this.meter.title = (progress * 100).toFixed(1) + "%";
    }

}

function ManualUI(elem, runner) {
    this.elem = elem;
    this.runner = runner;
    this.pass_button = this.elem.querySelector("button.pass");
    this.fail_button = this.elem.querySelector("button.fail");
    this.ref_buttons = this.elem.querySelector(".reftestUI");
    this.ref_type = this.ref_buttons.querySelector(".refType");
    this.test_button = this.ref_buttons.querySelector("button.test");
    this.ref_button = this.ref_buttons.querySelector("button.ref");

    this.hide();

    this.runner.test_start_callbacks.push(this.on_test_start.bind(this));
    this.runner.done_callbacks.push(this.on_done.bind(this));

    this.pass_button.onclick = (function() {
        this.runner.on_result("PASS", "", []);
        this.disable_buttons();
        setTimeout(this.enable_buttons.bind(this), 200);
    }).bind(this);

    this.fail_button.onclick = (function() {
        this.runner.on_result("FAIL", "", []);
    }).bind(this);
}

ManualUI.prototype = {
    show: function() {
        this.elem.style.display = "block";
    },

    hide: function() {
        this.elem.style.display = "none";
    },

    show_ref: function() {
        this.ref_buttons.style.display = "block";
        this.test_button.onclick = (function() {
            this.runner.load(this.runner.current_test.url);
        }).bind(this);
        this.ref_button.onclick = (function() {
            this.runner.load(this.runner.current_test.ref_url);
        }).bind(this);
    },

    hide_ref: function() {
        this.ref_buttons.style.display = "none";
    },

    disable_buttons: function() {
        this.pass_button.disabled = true;
        this.fail_button.disabled = true;
    },

    enable_buttons: function() {
        this.pass_button.disabled = false;
        this.fail_button.disabled = false;
    },

    on_test_start: function(test) {
        if (test.type == "manual" || test.type == "reftest") {
            this.show();
        } else {
            this.hide();
        }
        if (test.type == "reftest") {
            this.show_ref();
            this.ref_type.textContent = test.ref_type === "==" ? "equal" : "unequal";
        } else {
            this.hide_ref();
        }
    },

    on_done: function() {
        this.hide();
    }
}

function TestControl(elem, runner) {
    this.elem = elem;
    this.path_input = this.elem.querySelector(".path");
    this.pause_button = this.elem.querySelector("button.togglePause");
    this.start_button = this.elem.querySelector("button.toggleStart");
    this.type_checkboxes = Array.prototype.slice.call(
        this.elem.querySelectorAll("input[type=checkbox]"));
    this.runner = runner;
    this.runner.done_callbacks.push(this.on_done.bind(this));
    this.set_start();
}

TestControl.prototype = {
    set_start: function() {
        this.pause_button.disabled = true;
        this.start_button.textContent = "Start";
        this.path_input.disabled = false;
        this.type_checkboxes.forEach(function(elem) {
            elem.disabled = false;
        });
        this.start_button.onclick = (function() {
            var path = this.get_path();
            var test_types = this.get_test_types();
            this.runner.start(path, test_types);
            this.set_stop();
            this.set_pause();
        }).bind(this);
    },

    set_stop: function() {
        this.pause_button.disabled = false;
        this.start_button.textContent = "Stop";
        this.path_input.disabled = true;
        this.type_checkboxes.forEach(function(elem) {
            elem.disabled = true;
        });
        this.start_button.onclick = (function() {
            this.runner.done();
        }).bind(this);
    },

    set_pause: function() {
        this.pause_button.textContent = "Pause";
        this.pause_button.onclick = (function() {
            this.runner.pause();
            this.set_resume();
        }).bind(this);
    },

    set_resume: function() {
        this.pause_button.textContent = "Resume";
        this.pause_button.onclick = (function() {
            this.runner.unpause();
            this.set_pause();
        }).bind(this);

    },

    get_path: function() {
        return this.path_input.value;
    },

    get_test_types: function() {
        return this.type_checkboxes.filter(function(elem) {
            return elem.checked;
        }).map(function(elem) {
            return elem.value;
        });
    },

    on_done: function() {
        this.set_pause();
        this.set_start();
    }
};

function Results(runner) {
    this.test_results = null;
    this.runner = runner;

    this.runner.start_callbacks.push(this.on_start.bind(this));
}

Results.prototype = {
    on_start: function() {
        this.test_results = [];
    },

    set: function(test, status, message, subtests) {
        this.test_results.push({"test":test,
                                "subtests":subtests,
                                "status":status,
                                "message":message});
    },

    count: function() {
        return this.test_results.length;
    },

    to_json: function() {
        var data = {
            "results": this.test_results.map(function(result) {
                var rv = {"test":(result.test.hasOwnProperty("ref_url") ?
                                  [result.test.url, result.test.ref_type, result.test.ref_url] :
                                  result.test.url),
                          "subtests":result.subtests,
                          "status":result.status,
                          "message":result.message}
                return rv;
            })
        }
        return JSON.stringify(data, null, 2);
    }
}

function Runner(manifest_path, options) {
    this.server = location.protocol + "//" + location.host;
    this.manifest = new Manifest(manifest_path);
    this.path = null;
    this.test_types = null;
    this.manifest_iterator = null;

    this.test_window = null

    this.current_test = null;
    this.timeout = null;
    this.num_tests = null;
    this.pause_flag = false;

    this.start_callbacks = [];
    this.test_start_callbacks = [];
    this.result_callbacks = [];
    this.done_callbacks = [];

    this.results = new Results(this);

    this.start_after_manifest_load = false;
    this.manifest.load(this.manifest_loaded.bind(this));
};

Runner.prototype = {
    test_timeout: 20000, //ms

    currentTest: function() {
        return this.manifest[this.mTestCount];
    },

    open_test_window: function() {
        this.test_window = window.open("about:blank", 800, 600);
        window.focus();
    },

    manifest_loaded: function() {
        if (this.start_after_manifest_load) {
            this.do_start();
        }
    },

    start: function(path, test_types) {
        this.pause_flag = false;
        this.path = path;
        this.test_types = test_types;
        this.manifest_iterator = new ManifestIterator(this.manifest, this.path, this.test_types);
        this.num_tests = null;

        if (this.manifest.data === null) {
            this.start_after_manifest_load = true;
        } else {
            this.do_start();
        }
    },

    do_start: function() {
        this.open_test_window();
        this.start_callbacks.forEach(function(callback) {
            callback();
        });
        this.run_next_test();
    },

    pause: function() {
        this.pause_flag = true;
    },

    unpause: function() {
        this.pause_flag = false;
        this.run_next_test();
    },

    on_result: function(status, message, subtests) {
        clearTimeout(this.timeout);
        this.results.set(this.current_test, status, message, subtests);
        this.result_callbacks.forEach((function(callback) {
            callback(this.current_test, status, message, subtests);
        }).bind(this));
        this.run_next_test();
    },

    on_timeout: function() {
        this.on_result("TIMEOUT", "", []);
    },

    done: function() {
        this.test_window.close();
        this.done_callbacks.forEach(function(callback) {
            callback();
        });
    },

    run_next_test: function() {
        if (this.pause_flag) {
            return;
        }
        var next_test = this.manifest_iterator.next();
        if (next_test === null) {
            this.done();
            return;
        }

        this.current_test = next_test;

        if (next_test.type === "testharness") {
            this.timeout = setTimeout(this.on_timeout.bind(this),
                                      this.test_timeout);
        }
        this.load(this.current_test.url);

        this.test_start_callbacks.forEach((function(callback) {
            callback(this.current_test);
        }).bind(this));
    },

    load: function(path) {
        if (this.test_window.location === null) {
            this.open_test_window();
        }
        this.test_window.location.href = this.server + path;
    },

    progress: function() {
        return this.results.count() / this.test_count();
    },

    test_count: function() {
        if (this.num_tests === null) {
            this.num_tests = this.manifest_iterator.count();
        }
        return this.num_tests;
    }

};


function parseOptions() {
    var options = {
        test_types: ["testharness", "reftest", "manual"],
    };

    var optionstrings = location.search.substring(1).split("&");
    for (var i = 0, il = optionstrings.length; i < il; ++i) {
        var opt = optionstrings[i];
        //TODO: fix this for complex-valued options
        options[opt.substring(0, opt.indexOf("="))] =
            opt.substring(opt.indexOf("=") + 1);
    }
    return options;
}

function setup() {
    var options = parseOptions();

    if (options.path) {
        document.getElementById('path').value = options.path;
    }

    runner = new Runner("/MANIFEST.json", options);
    var test_control = new TestControl(document.getElementById("testControl"), runner);
    var manual_ui = new ManualUI(document.getElementById("manualUI"), runner);
    var visual_output = new VisualOutput(document.getElementById("output"), runner);

    if (options["autorun"] === "1") {
        runner.start(test_control.get_path(), test_control.get_test_types());
        return;
    }
}

window.completion_callback = function(tests, status) {
    var harness_status_map = {0:"OK", 1:"ERROR", 2:"TIMEOUT"}
    var subtest_status_map = {0:"PASS", 1:"FAIL", 2:"TIMEOUT", 3:"NOTRUN"}

    var subtest_results = tests.map(function (test) {
        return {name: test.name,
                status: subtest_status_map[test.status],
                message: test.message}
    });

    runner.on_result(harness_status_map[status.status],
                     status.message,
                     subtest_results)
}

window.addEventListener("DOMContentLoaded", setup, false);
})();
