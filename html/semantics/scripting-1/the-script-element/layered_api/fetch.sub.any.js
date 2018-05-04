// META: global=worker

promise_test((t) => {
    return promise_rejects(t, {name: "TypeError"},
      fetch(
        "std:blank|{{location[server]}}/html/semantics/scripting-1/the-script-element/layered_api/fallback.js",
        {mode: "cors"}),
      "Fetch should fail")
  }, "Fetch LAPI URL w/ fallback");

promise_test((t) => {
    return promise_rejects(t, {name: "TypeError"},
      fetch("std:blank", {mode: "cors"}),
      "Fetch should fail")
  }, "Fetch LAPI URL w/o fallback");
