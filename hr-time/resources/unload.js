const syncDelay = ms => {
  const start = performance.now();
  let elapsedTime;
  do {
    elapsedTime = performance.now() - start;
  } while (elapsedTime < ms);
};

const markTime = (docName, lifecycleEventName) => window.opener.mark({
  docName,
  lifecycleEventName,
  performanceNow: performance.now(),
  dateNow: Date.now()
});

const setupUnloadPrompt = (docName, msg) => {
  window.addEventListener("beforeunload", ev => {
    markTime(docName, "beforeunload");
    return ev.returnValue = msg || "Click OK to continue test."
  });
};

const setupListeners = (docName, nextDocument) => {
  window.addEventListener("load", () => {
    markTime(docName, "load");
    document.getElementById("proceed").addEventListener("click", ev => {
      ev.preventDefault();
      if (nextDocument) {
        document.location = nextDocument;
      } else {
        window.close();
      }
    })
  });

  setupUnloadPrompt(docName);

  window.addEventListener("unload", () => {
    markTime(docName, "unload");
    if (docName !== "c") { syncDelay(1000); }
  });
};

