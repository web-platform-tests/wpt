const div = document.getElementById('div');

promise_test(t => {
  const promise = new Promise((resolve, reject) => {
    globalThis.resolve = resolve;
    globalThis.reject = reject;
  });

  // Here, the mousedown event handler is called synchronously here, so the
  // execution context stack at the time of dynamic import call there
  // should be (from top to bottom):
  // #0. realm execution context, with [[ScriptOrModule]] == null
  //       (pushed by #prepare-to-run-script from #run-a-classic-script)
  // #1. scriptContext,
  //       with [[ScriptOrModule]] == `inline-event-handler-2.js`'s record
  //       (pushed by ScriptEvaluation from #run-a-classic-script)
  // #2. realm execution context, with [[ScriptOrModule]] == null
  //       (pushed by #prepare-to-run-script from
  //        https://heycam.github.io/webidl/#call-a-user-objects-operation)
  // #3. calleeContext, with [[ScriptOrModule]] == null set in
  //     #getting-the-current-value-of-the-event-handler
  //       (pushed by PrepareForOrdinaryCall from
  //        https://heycam.github.io/webidl/#call-a-user-objects-operation)
  //
  // Active script (https://tc39.es/ecma262/#sec-getactivescriptormodule)
  // should be #1's ScriptOrModule, and thus the base URL used for the dynamic
  // import should be `alpha/inline-event-handler-2.js`.
  //
  // The incumbent is not #1 due to #skip-when-determining-incumbent-counter.
  // Currently all browsers use settings object's base URL ==`beta/` for the
  // dynamic import, so implementations are more like the incumbent rather than
  // active script.
  const event = new MouseEvent('mousedown', {'button': 1});
  div.dispatchEvent(event);

  return promise.then(module => {
    assert_equals(module.A["from"], "alpha/imports.js");
    div.remove();
  });
},
"When triggered from inline event handlers triggered from external scripts, " +
"dynamic import's base URL should be that of the external scripts");
