function installAPI(global) {
  global.$262 = {
    createRealm: function() {
      var iframe = global.document.createElement('iframe');
      iframe.style.cssText = 'display: none';
      iframe.src = '';  // iframeSrc;
      if (global.document.body === null) {
        global.document.body = global.document.createElement('body');
      }
      global.document.body.appendChild(iframe);
      return installAPI(iframe.contentWindow);
    },
    evalScript: function(src) {
      var script = global.document.createElement('script');
      script.text = src;
      window.__test262_evalScript_error_ = undefined;
      global.document.head.appendChild(script);
      // Errors in the above appendChild bubble up to the global error handler.
      // Our testharnes-client.js stashes them in a global var for rethrowing.
      if (window.__test262_evalScript_error_) {
          err = window.__test262_evalScript_error_;
          window.__test262_evalScript_error_ = undefined;
          throw err;
      }
    },
    detachArrayBuffer: function(buffer) {
      if (typeof postMessage !== 'function') {
        throw new Error('No method available to detach an ArrayBuffer');
      } else {
        postMessage(null, '*', [buffer]);
        /*
          See
          https://html.spec.whatwg.org/multipage/comms.html#dom-window-postmessage
          which calls
          https://html.spec.whatwg.org/multipage/infrastructure.html#structuredclonewithtransfer
          which calls
          https://html.spec.whatwg.org/multipage/infrastructure.html#transfer-abstract-op
          which calls the DetachArrayBuffer abstract operation
          https://tc39.github.io/ecma262/#sec-detacharraybuffer
        */
      }
    },
    gc: function() {
      if (typeof gc !== 'function') {
        throw new Error('No method available to invoke a GC');
      }
      gc();
    },
    AbstractModuleSource: function() {
      throw new Error('AbstractModuleSource not available');
    },
    agent: (function () {
      var workers = [];
      var i32a = null;
      var pendingReports = [];

      // Agents call Atomics.wait on this location to sleep.
      var SLEEP_LOC = 0;
      // 1 if the started worker is ready, 0 otherwise.
      var START_LOC = 1;
      // The number of workers that have received the broadcast.
      var BROADCAST_LOC = 2;
      // Each worker has a count of outstanding reports; worker N uses memory
      // location [WORKER_REPORT_LOC + N].
      var WORKER_REPORT_LOC = 3;

      function workerScript(script) {
        return `
          var index;
          var i32a = null;
          var broadcasts = [];
          var pendingReceiver = null;

          function handleBroadcast() {
            if (pendingReceiver && broadcasts.length > 0) {
              pendingReceiver.apply(null, broadcasts.shift());
              pendingReceiver = null;
            }
          };

          var onmessage = function({data:msg}) {
            switch (msg.kind) {
              case 'start':
                i32a = msg.i32a;
                index = msg.index;
                (0, eval)(\`${script}\`);
                break;

              case 'broadcast':
                Atomics.add(i32a, ${BROADCAST_LOC}, 1);
                broadcasts.push([msg.sab, msg.id]);
                handleBroadcast();
                break;
            }
          };

          var $262 = {
            agent: {
              receiveBroadcast(receiver) {
                pendingReceiver = receiver;
                handleBroadcast();
              },

              report(msg) {
                postMessage(String(msg));
                Atomics.add(i32a, ${WORKER_REPORT_LOC} + index, 1);
              },

              sleep(s) { Atomics.wait(i32a, ${SLEEP_LOC}, 0, s); },

              leaving() {},

              monotonicNow() {
                return performance.now();
              }
            }
          };`;
      }

      var agent = {
        start(script) {
          if (i32a === null) {
            i32a = new Int32Array(new SharedArrayBuffer(256));
          }
          var w = new Worker(workerScript(script), {type: 'string'});
          w.index = workers.length;
          w.postMessage({kind: 'start', i32a: i32a, index: w.index});
          workers.push(w);
        },

        broadcast(sab, id) {
          if (!(sab instanceof SharedArrayBuffer)) {
            throw new TypeError('sab must be a SharedArrayBuffer.');
          }

          Atomics.store(i32a, BROADCAST_LOC, 0);

          for (var w of workers) {
            w.postMessage({kind: 'broadcast', sab: sab, id: id|0});
          }

          while (Atomics.load(i32a, BROADCAST_LOC) != workers.length) {}
        },

        getReport() {
          for (var w of workers) {
            while (Atomics.load(i32a, WORKER_REPORT_LOC + w.index) > 0) {
              pendingReports.push(w.getMessage());
              Atomics.sub(i32a, WORKER_REPORT_LOC + w.index, 1);
            }
          }

          return pendingReports.shift() || null;
        },

        sleep(s) { Atomics.wait(i32a, SLEEP_LOC, 0, s); },

        monotonicNow() {
          return performance.now();
        }
      };
      return agent;

    })(),
    global: global
  };
  global.$DONE = function() {}

  return global.$262;
}

installAPI(window);

