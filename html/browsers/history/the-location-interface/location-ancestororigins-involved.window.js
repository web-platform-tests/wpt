// META: script=/common/get-host-info.sub.js

const embedPath = new URL("resources/ancestororigins-embed.py", location.href).pathname,
      info = get_host_info(),
      localOrigin = info.HTTP_ORIGIN,
      localEmbed = localOrigin + embedPath,
      remoteOrigin = info.HTTP_REMOTE_ORIGIN,
      remoteEmbed = remoteOrigin + embedPath,
      remoteOrigin2 = info.HTTP_REMOTE_ORIGIN_WITH_DIFFERENT_PORT,
      remoteEmbed2 = remoteOrigin2 + embedPath;
let id = 0;

async_test(t => {
  const iframe = document.createElement("iframe"),
        localId = ++id;
  iframe.sandbox = "allow-scripts";
  iframe.src = localEmbed + "?iframe=|" + remoteEmbed + "?id=" + localId;
  document.body.appendChild(iframe);
  t.add_cleanup(() => iframe.remove());

  self.addEventListener("message", t.step_func(e => {
    if(e.data.id === localId) {
      assert_array_equals(e.data.output, ["null", localOrigin]);
      t.done();
    }
  }));
}, "Ensure sandboxed iframes show up as null");

// The following code ends up generating multiple tests each with multiple nested <iframe>s. The
// variables in the array below seed various scenarios, described by "desc". The capital letters
// describe the <iframe>s in play. When the same letter is used at different nesting levels that
// means it is same-origin. Some defaulting is used to avoid too much duplication.
[
  {
    outerPolicy: true,
    desc: "A uses no-referrer -> B -> A",
    results: [remoteOrigin, "null"]
  },
  {
    outerPolicy: true,
    innerEmbed: remoteEmbed2,
    desc: "A uses no-referrer -> B -> C",
    results: [remoteOrigin, "null"]
  },
  {
    innerPolicy: true,
    desc: "A -> B uses no-referrer -> A",
    results: ["null", localOrigin]
  },
  {
    innerPolicy: true,
    innerEmbed: remoteEmbed2,
    desc: "A -> B uses no-referrer -> C",
    results: ["null", localOrigin]
  },
  {
    innerPolicy: true,
    outerEmbed: localEmbed,
    innerEmbed: remoteEmbed,
    desc: "A -> A uses no-referrer -> C",
    results: ["null", "null"],
    intermediateResults: [localOrigin]
  },
  {
    innerPolicy: true,
    outerEmbed: localEmbed,
    desc: "A -> A uses no-referrer -> A",
    results: ["null", "null"],
    intermediateResults: [localOrigin]
  }
].forEach(val => {
  async_test(t => {
    if(!val.intermediateResults) {
      val.intermediateResults = [val.results[1]];
    }
    if(!val.outerEmbed) {
      val.outerEmbed = remoteEmbed;
    }
    if(!val.innerEmbed) {
      val.innerEmbed = localEmbed;
    }

    const iframe = document.createElement("iframe"),
          innerId = ++id,
          innermostId = ++id;
    if(val.outerPolicy) {
      iframe.referrerPolicy = "no-referrer";
    }
    let innerPolicy = "";
    if(val.innerPolicy) {
      innerPolicy = "no-referrer";
    }
    iframe.src = val.outerEmbed + "?id=" + innerId + "&iframe=" + innerPolicy + "|" + val.innerEmbed + "?id=" + innermostId;
    document.body.appendChild(iframe);
    t.add_cleanup(() => iframe.remove());

    let almostDone = false;
    function localDone () {
      if(almostDone) {
        t.done();
      }
      almostDone = true;
    }

    self.addEventListener("message", t.step_func(e => {
      if(e.data.id === innerId) {
        assert_array_equals(e.data.output, val.intermediateResults);
        localDone();
      }
      else if(e.data.id === innermostId) {
        assert_array_equals(e.data.output, val.results);
        localDone();
      }
    }));
  }, val.desc);
});

[
  {
    desc: "A -> B -> B uses no-referrer -> A",
    innerinnerEmbed: localEmbed
  },
  {
    desc: "A -> B -> B uses no-referrer -> B",
    innerinnerEmbed: remoteEmbed
  },
  {
    desc: "A -> B -> B uses no-referrer -> C",
    innerinnerEmbed: remoteEmbed2
  }
].forEach(val => {
  async_test(t => {
    const iframe = document.createElement("iframe"),
          localId = ++id;
    iframe.src = remoteEmbed + "?iframe=|" + remoteEmbed + "?iframe=no-referrer%257C" + val.innerinnerEmbed + "?id=" + localId;
    document.body.appendChild(iframe);
    t.add_cleanup(() => iframe.remove());

    self.addEventListener("message", t.step_func(e => {
      if(e.data.id === localId) {
        assert_array_equals(e.data.output, ["null", "null", localOrigin]);
        t.done();
      }
    }));
  }, val.desc);
});

async_test(t => {
  const iframe = document.createElement("iframe"),
        localId = ++id;
  document.body.appendChild(iframe);
  t.add_cleanup(() => iframe.remove());

  const a = document.createElement("a");
  a.rel = "noreferrer";
  a.href = localEmbed + "?id=" + localId;
  iframe.contentDocument.body.appendChild(a);
  a.click();

  self.addEventListener("message", t.step_func(e => {
    if(e.data.id === localId) {
      assert_array_equals(e.data.output, ["null"]);
      t.done();
    }
  }));
}, "rel=noreferrer should redact");
