var SRIScriptTest = function(pass, name, src, integrityValue, crossoriginValue, nonce) {
    this.pass = pass;
    this.name = "Script: " + name;
    this.src = src;
    this.integrityValue = integrityValue;
    this.crossoriginValue = crossoriginValue;
    this.nonce = nonce;
}

SRIScriptTest.prototype.execute = function() {
    var test = async_test(this.name);
    var e = document.createElement("script");
    e.src = this.src;
    e.setAttribute("integrity", this.integrityValue);
    if(this.crossoriginValue) {
        e.setAttribute("crossorigin", this.crossoriginValue);
    }
    if(this.nonce) {
      e.setAttribute("nonce", this.nonce);
    }
    if(this.pass) {
        e.addEventListener("load", function() {test.done()});
        e.addEventListener("error", function() {
            test.step(function(){ assert_unreached("Good load fired error handler.") })
        });
    } else {
       e.addEventListener("load", function() {
            test.step(function() { assert_unreached("Bad load succeeded.") })
        });
       e.addEventListener("error", function() {test.done()});
    }
    document.body.appendChild(e);
};

function buildElementFromDestination(destination, attrs) {
  // Assert: |destination| is a valid destination.
  let element;
  switch (destination) {
    case "script":
    case "audio":
      element = document.createElement(destination);
      break;
    case "font":
      element = document.createElement('link');
      break;
    default:
      console.error("INVALID DESTINATION: ", destination);
  }

  // TODO(domfarolino): Hmm, maybe simplify this?
  for (const [attr_name, attr_val] of Object.entries(attrs)) {
    element[attr_name] = attr_val;
  }

  console.log(element);
  return element;
}

var SRIPreloadTest = function(preload_sri_success, subresource_sri_success, name, link_attrs, subresource_attrs) {
  this.preload_sri_success = preload_sri_success
  this.subresource_sri_success = subresource_sri_success;
  this.name = name;

  // |destination| is used to create the appropriate subresource-fetching
  // element that will attempt to utilize the preload.
  this.destination = link_attrs.as;
  this.link_attrs = link_attrs;
  this.subresource_attrs = subresource_attrs;
}

SRIPreloadTest.prototype.execute = function() {
  const test = async_test(this.name);
  const link = document.createElement('link');
  const subresource_element = buildElementFromDestination(this.destination, this.subresource_attrs);

  // Build up the link. |subresource_element| is built-up by
  // |buildElementFromDestination()|.
  link.rel = 'preload';
  for (const [attr_name, attr_val] of Object.entries(this.link_attrs)) {
    link[attr_name] = attr_val;
  }

  // Link preload success and failure loading functions.
  // The first two are just to weed out loading steps that unexpectedly fail.
  const good_load_failed = test.step_func(() => { assert_unreached("Good load fired error handler.") });
  const bad_load_succeeded = test.step_func(() => { assert_unreached("Bad load succeeded.") });
  const subresource_pass = test.step_func(() => { test.done(); });
  const preload_pass = test.step_func(() => {
    if (this.subresource_sri_success) {
      subresource_element.onload = subresource_pass;
      subresource_element.onerror = good_load_failed;
    } else {
      subresource_element.onload = bad_load_succeeded;
      subresource_element.onerror = subresource_pass;
    }

    document.body.append(subresource_element);
  });

  if (this.preload_sri_success) {
    link.onload = preload_pass;
    link.onerror = good_load_failed;
  } else {
    link.onload = bad_load_succeeded;
    link.onerror = preload_pass;
  }

  document.head.append(link);
}

// <link> tests
// Style tests must be done synchronously because they rely on the presence
// and absence of global style, which can affect later tests. Thus, instead
// of executing them one at a time, the style tests are implemented as a
// queue that builds up a list of tests, and then executes them one at a
// time.
var SRIStyleTest = function(queue, pass, name, attrs, customCallback, altPassValue) {
    this.pass = pass;
    this.name = "Style: " + name;
    this.customCallback = customCallback || function () {};
    this.attrs = attrs || {};
    this.passValue = altPassValue || "rgb(255, 255, 0)";

    this.test = async_test(this.name);

    this.queue = queue;
    this.queue.push(this);
}

SRIStyleTest.prototype.execute = function() {
  var that = this;
    var container = document.getElementById("container");
    while (container.hasChildNodes()) {
      container.removeChild(container.firstChild);
    }

    var test = this.test;

    var div = document.createElement("div");
    div.className = "testdiv";
    var e = document.createElement("link");

    // The link relation is guaranteed to not be "preload" or "modulepreload".
    this.attrs.rel = this.attrs.rel || "stylesheet";
    for (var key in this.attrs) {
        if (this.attrs.hasOwnProperty(key)) {
            e.setAttribute(key, this.attrs[key]);
        }
    }

    if(this.pass) {
        e.addEventListener("load", function() {
            test.step(function() {
                var background = window.getComputedStyle(div, null).getPropertyValue("background-color");
                assert_equals(background, that.passValue);
                test.done();
            });
        });
        e.addEventListener("error", function() {
            test.step(function(){ assert_unreached("Good load fired error handler.") })
        });
    } else {
        e.addEventListener("load", function() {
             test.step(function() { assert_unreached("Bad load succeeded.") })
         });
        e.addEventListener("error", function() {
            test.step(function() {
                var background = window.getComputedStyle(div, null).getPropertyValue("background-color");
                assert_not_equals(background, that.passValue);
                test.done();
            });
        });
    }
    container.appendChild(div);
    container.appendChild(e);
    this.customCallback(e, container);
};

