/**
 * This script implements the $262 host provider API (test262-provider.js) for Test262
 * tests running in WPT. It provides the necessary environment for Test262 tests to
 * execute and communicate with the WPT runner.
 *
 * See Test262 INTERPRETING.md for the specification of this API:
 * https://github.com/tc39/test262/blob/main/INTERPRETING.md
 */

function installAPI(global) {
  global.$262 = {
    /**
     * Creates a new ECMAScript Realm (iframe), defines this API on it,
     * and returns the $262 object of the new realm.
     */
    createRealm: function() {
      const iframe = global.document.createElement('iframe');
      iframe.style.display = 'none';

      const container = global.document.body;
      if (!container) {
        // Should not happen.
          throw new Error('Test262 Host API: createRealm() called before document.body was available.');
      }
      container.appendChild(iframe);

      return installAPI(iframe.contentWindow);
    },

    /**
     * Executes a string as an ECMAScript script.
     */
    evalScript: function(src) {
      const script = global.document.createElement('script');
      script.text = src;
      window.__test262_evalScript_error_ = undefined;

      global.document.head.appendChild(script);

      // Errors in the above appendChild bubble up to the global error handler.
      // test262-reporter.js stashes them in a global var for rethrowing.
      if (window.__test262_evalScript_error_) {
          const err = window.__test262_evalScript_error_;
          window.__test262_evalScript_error_ = undefined;
          throw err;
      }
    },

    /**
     * Detaches an ArrayBuffer.
     */
    detachArrayBuffer: function(buffer) {
      // Transfer and thus detach the buffer.
      postMessage(null, '*', [buffer]);
    },

    /**
     * Triggers garbage collection if supported by the host.
     */
    gc: function() {
      throw new Error('Test262 Host API: gc() not supported');
    },

    /**
     * Reference to the %AbstractModuleSource% constructor.
     */
    AbstractModuleSource: function() {
      throw new Error('Test262 Host API: AbstractModuleSource not available');
    },

    agent: (function () {
      const workers = [];
      let i32a = null;
      const pendingReports = [];

      // Agents call Atomics.wait on this location to sleep.
      const SLEEP_LOC = 0;
      // 1 if the started worker is ready, 0 otherwise.
      const START_LOC = 1;
      // The number of workers that have received the broadcast.
      const BROADCAST_LOC = 2;
      // Each worker has a count of outstanding reports; worker N uses memory
      // location [WORKER_REPORT_LOC + N].
      const WORKER_REPORT_LOC = 3;

      function workerScript(script) {
        return `
          let index;
          let i32a = null;
          let broadcasts = [];
          let pendingReceiver = null;

          function handleBroadcast() {
            if (pendingReceiver && broadcasts.length > 0) {
              pendingReceiver.apply(null, broadcasts.shift());
              pendingReceiver = null;
            }
          };

          self.onmessage = function({data:msg}) {
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

          self.$262 = {
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

      const agent = {
        start(script) {
          if (i32a === null) {
            i32a = new Int32Array(new SharedArrayBuffer(256));
          }
          const w = new Worker(URL.createObjectURL(new Blob([workerScript(script)], {type: 'text/javascript'})));
          w.index = workers.length;
          w.postMessage({kind: 'start', i32a: i32a, index: w.index});
          workers.push(w);
        },

        broadcast(sab, id) {
          if (!(sab instanceof SharedArrayBuffer)) {
            throw new TypeError('sab must be a SharedArrayBuffer.');
          }

          Atomics.store(i32a, BROADCAST_LOC, 0);

          for (const w of workers) {
            w.postMessage({kind: 'broadcast', sab: sab, id: id|0});
          }

          while (Atomics.load(i32a, BROADCAST_LOC) != workers.length) {}
        },

        getReport() {
          for (const w of workers) {
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

