// Functions available by default in the executor.

let executorStartEvent = null;

function requestExecutor() {
  const params = new URLSearchParams(location.search);
  const startOn = params.get('startOn');

  if (startOn) {
    addEventListener(startOn, (e) => {
      executorStartEvent = e;
      startExecutor();
    });
  } else {
    startExecutor();
  }
}

function addScript(url) {
  const script = document.createElement('script');
  script.src = url;
  const promise = new Promise((resolve, reject) => {
    script.onload = () => {
      resolve(url);
    };
    script.onerror = (e) => {
      reject(e);
    };
  });
  document.body.appendChild(script);
  return promise;
}

// Suspends the executor and executes the function in `fnString` when it has
// suspended. Also installs a pageshow handler to resume the executor if the
// document is BFCached.
function executeScriptToNavigate(fnString, args) {
  window.addEventListener('pageshow', (event) => {
    executor.resume();
  }, {once: true});
  executor.suspend(() => {
    eval(fnString).apply(null, args);
  });
}
