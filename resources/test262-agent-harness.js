// Helper file to run a test262 within an agent.
//
// The target test262 is in text format. The harnessing code composes an HTML
// page containing the test262, runs it and reports for errors if there was
// any.  Similarly if the target agent is a Worker, the harnessing code embedes
// the test code within the target worker, runs the test and checks out if
// there were any errors.
//
// Currently supported agents are IFrame, Window, Worker and SharedWorker.

// IFrame.
function run_in_iframe_strict(test262, attrs, t) {
    let opts = {}
    opts.strict = true;
    run_in_iframe(test262, attrs, t, opts);
}

// If 'negative' attribute was defined, the test must pass if 'message'
// matches 'negative.type'.
function is_negative(attrs, message) {
    let negative = attrs.negative || {};
    return message && message.indexOf(negative.type) >= 0;
}

function run_in_iframe(test262, attrs, t, opts) {
  opts = opts || {};
  // Rethrow error from iframe.
  window.addEventListener('message', t.step_func(function(e) {
    if (e.data[0] == 'error') {
      throw new Error(e.data[1]);
    }
  }));
  let iframe = document.createElement('iframe');
  iframe.style = 'display: none';
  content = test262_as_html(test262, attrs, opts.strict);
  let blob = new Blob([content], {type: 'text/html'});
  iframe.src = URL.createObjectURL(blob);
  document.body.appendChild(iframe);

  let w = iframe.contentWindow;
  // Finish test on completed event.
  w.addEventListener('completed', t.step_func(function(e) {
    t.done();
  }));
  // If test failed, rethrow error.
  let FAILED = 'iframe-failed' + opts.strict ? 'strict' : '';
  window.addEventListener(FAILED, t.step_func(function(e) {
    t.set_status(t.FAIL);
    throw new Error(e.detail);
  }));
  // In case of error send it to parent window.
  w.addEventListener('error', function(e) {
    e.preventDefault();
    if (is_negative(attrs, e.message)) {
        t.done();
        return;
    }
    top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
  });
}

let HEADER = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>

  <!-- Test262 required libraries -->
  <script src="http://{{host}}:{{ports[http][0]}}/resources/test262/harness/assert.js"><\/script>
  <script src="http://{{host}}:{{ports[http][0]}}/resources/test262/harness/sta.js"><\/script>

  <script src="http://{{host}}:{{ports[http][0]}}/resources/test262-harness.js"><\/script>

  ###INCLUDES###

  <script type="text/javascript">
    function __completed__() {
      window.dispatchEvent(new CustomEvent('completed'));
    }
  <\/script>
</head>
<body>
</body>
<script type="###MIME_TYPE###">
`;
let FOOTER = `
  ;__completed__();
<\/script>
</html>
`;

function test262_as_html(test262, attrs, strict) {
  function header() {
    let header = HEADER.replace('###INCLUDES###', addScripts(attrs));
    return header.replace('###MIME_TYPE###', mimeType(attrs));
  }
  function footer() {
    return FOOTER;
  }
  let output = [];
  output.push(header());
  output.push(prepareTest(test262, attrs, strict));
  output.push(footer());
  return output.join("");
}

function mimeType(attrs) {
  let flags = attrs && attrs.flags;
  return flags && flags.includes('module') ? 'module' : 'text/javascript';
}

function addScripts(attrs) {
  includes = attrs && attrs.includes || [];
  let flags = attrs && attrs.flags || [];
  if (flags && flags.includes('async')) {
      includes.push('doneprintHandle.js');
  }
  let ret = [];
  let root = 'http://{{host}}:{{ports[http][0]}}/resources/test262/harness/';
  includes.forEach(function(src) {
    ret.push("<script src='###SRC###'><\/script>".replace('###SRC###', root + src));
  });
  return ret.join("\n");
}

function prepareTest(test262, attrs, strict) {
    let output = [];
    function write(str) {
        output.push(str);
    }
    function flush() {
        return output.join("\n");
    }
    function run_in_eval(str) {
        return 'eval("' + str.replace(/"/g, '\\"') + '");';
    }
    let test_code = test262();
    let negative = attrs.negative || {}
    if (negative.phase == 'parse' || negative.phase == 'early') {
        let type = negative.type;
        write("try {");
        if (strict) {
            write("'use strict';");
        }
        write(run_in_eval(test_code));
        write("} catch (e) {");
        // XXX: For many tests Firefox throws a SyntaxError instanceof of a ReferenceError.
        write(`    if (e instanceof ${type} || e instanceof SyntaxError) {`);
        write("        __completed__();");
        write("    } else {");
        write("        throw e;");
        write("    }");
        write("}");
    } else {
        if (strict) {
            write("'use strict';");
        }
        write(test_code);
    }
    return flush();
}

// Window.
function run_in_window_strict(test262, attrs, t) {
    let opts = {}
    opts.strict = true;
    run_in_window(test262, attrs, t, opts);
}

function run_in_window(test262, attrs, t, opts) {
  opts = opts || {};
  let content = test262_as_html(test262, attrs, opts.strict);
  let blob = new Blob([content], {type: 'text/html'});
  let page = URL.createObjectURL(blob);
  let popup = window.open(page, 'popup');
  // Finish test on completed event.
  popup.addEventListener('completed', t.step_func(function(e) {
    popup.close();
    t.done();
  }));
  // If test failed, rethrow error.
  let FAILED = 'popup-failed' + opts.strict ? 'strict' : '';
  window.addEventListener(FAILED, t.step_func(function(e) {
    popup.close();
    t.set_status(t.FAIL);
    throw new Error(e.detail);
  }));
  // In case of error send it to parent window.
  popup.addEventListener('error', function(e) {
    e.preventDefault();
    if (is_negative(attrs, e.message)) {
        popup.close();
        t.done();
        return;
    }
    top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
  });
}

// Worker.
let WORKER_TEMPLATE = `
  ###INCLUDES###

  function __completed__() {
    postMessage(['completed', '###NAME###']);
  }

  onmessage = function(e) {
    ###BODY###
    __completed__();
  }
`;

function workerNameByType(type, strict) {
    strict = strict || false;
    return type.toLowerCase() + (strict ? "strict" : "");
}

function createWorkerFromString(test262, attrs, opts) {
  function importScripts(sources) {
    sources = sources || [];
    let root = 'http://{{host}}:{{ports[http][0]}}/resources';
    let ret = [`"${root}/test262-harness.js"`];
    let mandatory = ['assert.js', 'sta.js'];
    let flags = attrs && attrs.flags || [];
    if (flags && flags.includes('async')) {
        mandatory.push('doneprintHandle.js');
    }
    mandatory.forEach(function(filename) {
      ret.push(`"${root}/test262/harness/${filename}"`);
    });
    sources.forEach(function(filename) {
      ret.push(`"${root}/test262/harness/${filename}"`);
    });
    return "importScripts(" + ret.join(",") + ");";
  }
  function createWorker(type, code) {
    let blob = new Blob([code], {type: 'text/javascript'});
    if (type == 'Worker') {
      return new Worker(URL.createObjectURL(blob));
    }
    if (type == 'SharedWorker') {
      return new SharedWorker(URL.createObjectURL(blob));
    }
    throw new Error('unreachable');
  }
  function getWorkerTemplate(type) {
    if (type == 'Worker') {
      return WORKER_TEMPLATE;
    }
    if (type == 'SharedWorker') {
      return SHARED_WORKER_TEMPLATE;
    }
    throw new Error('unreachable');
  }
  let type = opts.worker_type || 'Worker';
  let template = getWorkerTemplate(type);
  template = template.replace('###INCLUDES###', importScripts(attrs.includes));
  template = template.replace('###NAME###', workerNameByType(type, opts.strict));
  template = template.replace('###BODY###', prepareTest(test262, attrs, opts.strict));
  return createWorker(type, template);
}

function run_in_worker_strict(test262, attrs, t) {
    let opts = {}
    opts.strict = true;
    run_in_worker(test262, attrs, t, opts);
}

function run_in_worker(test262, attrs, t, opts) {
  opts = opts || {};
  let worker = createWorkerFromString(test262, attrs, opts);
  let worker_name = workerNameByType('Worker', opts.strict);
  worker.addEventListener('message', t.step_func(function(e) {
    let [message, name] = e.data;
    if (message == 'completed' && name == worker_name) {
      t.done();
    }
  }));
  // If test failed, rethrow error.
  let FAILED = 'worker-failed' + opts.strict ? 'strict' : '';
  window.addEventListener(FAILED, t.step_func(function(e) {
    t.set_status(t.FAIL);
    throw new Error(e.detail);
  }));
  // In case of error send it back to sender.
  worker.addEventListener('error', function(e) {
    e.preventDefault();
    if (is_negative(attrs, e.message)) {
        t.done();
        return;
    }
    top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
  });
  worker.postMessage([]);
}

// SharedWorker.
let SHARED_WORKER_TEMPLATE = `
  ###INCLUDES###

  onconnect = function(e) {

    let port = e.ports[0];

    function __completed__() {
      port.postMessage(['completed', '###NAME###']);
    }

    port.addEventListener('message', function(e) {
      ###BODY###
      __completed__();
    });

    port.start();
  }
`;

function run_in_shared_worker_strict(test262, attrs, t) {
    let opts = {}
    opts.strict = true;
    run_in_shared_worker(test262, attrs, t, opts);
}

function run_in_shared_worker(test262, attrs, t, opts) {
  opts = opts || {};
  let worker = createSharedWorkerFromString(test262, attrs, opts);
  let worker_name = workerNameByType('SharedWorker', opts.strict);
  worker.port.addEventListener('message', t.step_func(function(e) {
    let [message, name] = e.data;
    if (message == 'completed' && name == worker_name) {
      t.done();
    }
  }));
  // If test failed, rethrow error.
  let FAILED = 'shared-worker-failed' + opts.strict ? 'strict' : '';
  window.addEventListener(FAILED, t.step_func(function(e) {
    t.set_status(t.FAIL);
    throw new Error(e.detail);
  }));
  // In case of error send it back to sender.
  worker.addEventListener('error', function(e) {
    e.preventDefault();
    if (is_negative(attrs, e.message)) {
        t.done();
        return;
    }
    top.dispatchEvent(new CustomEvent(FAILED, {detail: e.message}));
  });
  worker.port.start();
  worker.port.postMessage([]);
}

function createSharedWorkerFromString(test262, attrs, opts) {
    opts.worker_type = 'SharedWorker';
    return createWorkerFromString(test262, attrs, opts);
}
