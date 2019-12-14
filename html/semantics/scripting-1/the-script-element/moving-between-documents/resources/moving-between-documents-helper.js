"use strict";

function createDocument(documentType, result, inlineOrExternal, type, hasBlockingStylesheet) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.src =
      "resources/moving-between-documents-iframe.py" + 
      "?result=" + result +
      "&inlineOrExternal=" + inlineOrExternal +
      "&type=" + type +
      "&hasBlockingStylesheet=" + hasBlockingStylesheet +
      "&cache=" + Math.random();
    // As blocking stylesheets delays Document load events, we use
    // DOMContentLoaded here.
    // After that point, we expect iframe.contentDocument exists
    // while still waiting for blocking stylesheet loading.
    document.body.appendChild(iframe);

    window.addEventListener('message', (event) => {
      console.log(event.source.location.href);
      if (documentType === "iframe") {
        resolve([iframe.contentWindow, iframe.contentDocument]);
      } else if (documentType === "createHTMLDocument") {
        resolve([
            iframe.contentWindow,
            iframe.contentDocument.implementation.createHTMLDocument("")]);
      } else {
        reject(new Error("Invalid document type: " + documentType));
      }
    }, {once: true});
  });
}

window.scriptErrorEventFired = false;
window.didExecute = undefined;

// For a script, there are four associated Documents that can
// potentially different:
// [1] script's parser document
// [2] script's node document at the beginning of #prepare-a-script
//     == script's preparation-time document
// [3] script's node document at the beginning of
//     #execute-the-script-block
//
// In the spec, scripts are not executed only if [1]/[2]/[3] are all the same
// (or [1] is null and [2]==[3]).
// [1]==[2] is tested in #prepare-a-script (Step 10), and
// [1]==[3] and [2]==[3] are tested in #execute-the-script-block.
//
// This helper is for tests where [1]/[2]/[3] are different.

// timing:
//   "before-prepare":
//     A <script> is moved during parsing before #prepare-a-script.
//     [1] != [2] == [3]
//   "after-prepare":
//     A <script> is moved after parsing/#prepare-a-script but
//     before #execute-the-script-block.
//     To move such scripts, #has-a-style-sheet-that-is-blocking-scripts
//     is utilized to block inline scripts after #prepare-a-script.
//     TODO: This mechanism isn't complete in some cases.
//     [1] == [2] != [3]
//   "parsing but moved back"
//     A <script> is moved before #prepare-a-script, but moved back again
//     to the original Document after #prepare-a-script.
//     [1] == [3] != [2]
//
// destType: "iframe" or "createHTMLDocument".
// result: "fetch-error", "parse-error", or "success".
// inlineOrExternal: "inline" or "external".
// type: "classic" or "module".
async function runTest(timing, destType, result, inlineOrExternal, type) {
  if (result === "fetch-error" && inlineOrExternal === "inline") {
    return;
  }

  const description =
      `Move ${result} ${inlineOrExternal} ${type} script ` + 
      `to ${destType} ${timing}`;

  const t = async_test("Eval: " + description);
  const tScriptLoadEvent = async_test("<script> load: " + description);
  const tScriptErrorEvent = async_test("<script> error: " + description);
  const tWindowErrorEvent = async_test("window error: " + description);

  // If scripts should be moved after #prepare-a-script before
  // #execute-the-script-block, we add a style sheet that is
  // blocking scripts.
  const hasBlockingStylesheet =
      timing === "after-prepare" || timing === "move-back";

  const [sourceWindow, sourceDocument] = await createDocument(
      "iframe", result, inlineOrExternal, type, hasBlockingStylesheet);

  // Due to https://crbug.com/1034176, Chromium needs
  // blocking stylesheets also in the destination Documents.
  const [destWindow, destDocument] = await createDocument(
      destType, null, null, null, hasBlockingStylesheet);

  const shouldScriptErrorEventFired = false;
  // TODO: Temporarily set to false just to test behaviors on
  // the current browsers.
  // during === "failed fetch" && destType === "iframe";

  let scriptErrorEventFired = false;
  const scriptOnError = (event) => {
    // For Firefox: Prevent window.onerror is fired due to propagation
    // from <script>'s error event.
    event.stopPropagation();
    if (shouldScriptErrorEventFired) {
      scriptErrorEventFired = true;
    } else {
     tScriptErrorEvent.unreached_func("onerror")();
    }
  };

  sourceWindow.didExecute = false;
  sourceWindow.t = t;
  sourceWindow.tScriptLoadEvent = tScriptLoadEvent;
  sourceWindow.tScriptErrorEvent = tScriptErrorEvent;
  sourceWindow.scriptOnError = scriptOnError;
  sourceWindow.onerror = tWindowErrorEvent.unreached_func(
      "Window error event shouldn't fired on source window");
  sourceWindow.readyToEvaluate = false;

  destWindow.didExecute = false;
  destWindow.t = t;
  destWindow.tScriptLoadEvent = tScriptLoadEvent;
  destWindow.tScriptErrorEvent = tScriptErrorEvent;
  destWindow.scriptOnError = scriptOnError;
  destWindow.onerror = tWindowErrorEvent.unreached_func(
      "Window error event shouldn't fired on destination window");
  destWindow.readyToEvaluate = false;

  // t=0 sec: Move between documents before #prepare-a-script.
  // At this time, the script element is not yet inserted to the DOM.
  if (timing === "before-prepare" || timing === "move-back") {
    destDocument.body.appendChild(
      sourceDocument.querySelector("streaming-element"));
  }
  if (timing === "before-prepare") {
    sourceWindow.readyToEvaluate = true;
    destWindow.readyToEvaluate = true;
  }

  // t=1 sec: the script element is inserted to the DOM, i.e.
  // #prepare-a-script is triggered (see monving-between-documents-iframe.py).
  // In the case of `before-prepare`, the script can be evaluated.
  // In other cases, the script evaluation is blocked by a style sheet.
  await new Promise(resolve => step_timeout(resolve, 2000));

  // t=2 sec: Move between documents after #prepare-a-script.
  if (timing === "after-prepare") {
   destDocument.body.appendChild(
      sourceDocument.querySelector("streaming-element"));
  }
  else if (timing === "move-back") {
    sourceDocument.body.appendChild(
      destDocument.querySelector("streaming-element"));
  }
  sourceWindow.readyToEvaluate = true;
  destWindow.readyToEvaluate = true;

  // t=3 or 5 sec: Blocking stylesheet and external script are loaded,
  // and thus script evaulation is unblocked.

  // Note: scripts are expected to be loaded at t=3, because the fetch
  // is started by #prepare-a-script at t=1, and the script's delay is
  // 2 seconds. However in Chromium, due to preload scanner, the script
  // loading might take 4 seconds, because the first request by preload
  // scanner of the source Document takes 2 seconds (between t=1 and t=3)
  // which blocks the second request by #prepare-a-script that takes
  // another 2 seconds (between t=3 and t=5).

  // t=6 sec: After all possible script evaluation points, test whether
  // the script/events were evaluated/fired or not.
  // As we have concurrent tests, a single global step_timeout() is
  // used instead of multiple `t.step_timeout()` etc.,
  // to avoid potential race conditions between `t.step_timeout()`s.
  return new Promise(resolve => {
    step_timeout(() => {
      tWindowErrorEvent.done();
      tScriptLoadEvent.done();
      tScriptErrorEvent.step_func_done(() => {
        if (shouldScriptErrorEventFired) {
          assert_true(scriptErrorEventFired,
              "error event should be fired");
        }
      })();

      t.step_func_done(() => {
        assert_false(sourceWindow.didExecute,
          "The script must not have executed in source window");
        assert_false(destWindow.didExecute,
          "The script must not have executed in destination window");
      })();
      resolve();
    }, 4000);
  });
}

async_test(t => {
  t.step_timeout(() => {
      assert_equals(window.didExecute, undefined,
        "The script must not have executed in the top-level window");
      assert_false(window.scriptErrorEventFired,
        "Top-level window's scriptErrorEventFired should be untouched");
      t.done();
    },
    4000);
}, "Sanity check around top-level Window");
