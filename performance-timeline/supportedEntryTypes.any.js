function forcePerformanceEntry(entryType) {
  switch (entryType) {
    case 'resource':
      fetch(window.location.href + "?" + Math.random());
      break;

    case 'longtask':
      syncWait(50);
      break;

    case 'mark':
      performance.mark('foo');
      break;

    case 'measure':
      performance.measure('bar');
      break;

    case 'paint':
      document.head.parentNode.appendChild(document.createTextNode('baz'));
      break;

    case 'navigation':
      break;

    default:
      assert_unreached(`entryType "${entryType}" not supported`);
  }
}

function syncWait(waitDuration) {
  if (waitDuration <= 0)
    return;

  const startTime = performance.now();
  let unused = '';
  for (let i = 0; i < 10000; i++)
    unused += '' + Math.random();

  return syncWait(waitDuration - (performance.now() - startTime));
}

async_test((test) => {
  if (typeof PerformanceObserver.supportedEntryTypes === "undefined")
    assert_unreached("supportedEntryTypes is not supported.");
  const types = PerformanceObserver.supportedEntryTypes;
  assert_greater_than(types.length, 0,
    "There should be at least one entry in supportedEntryTypes.");

  const waitTime = 1000;
  Promise.all(types.map((entryType) => {
    return new Promise((resolve, reject) => {
      const observer = new PerformanceObserver(function(list, observer) {
        clearTimeout(timeoutID);
        observer.disconnect();
        resolve();
      });
      observer.observe({entryTypes: [entryType]});

      const timeoutID = step_timeout(() => {
        observer.disconnect();
        assert_unreached(`entryType "${entryType}" was not observed after ${waitTime} ms.`)
        reject(entryType)
      }, waitTime)
    })
  })).then(() => {
    test.done();
  })

  for (let i = 0; i < types.length; i++) {
    if (i < types.length - 1) {
      assert_true(types[i] < types[i + 1],
        "The strings '" + types[i] + "' and '" + types[i + 1] +
        "' are repeated or they are not in alphabetical order.");
    }
    forcePerformanceEntry(types[i]);
  }
}, "supportedEntryTypes exists, returns entry types in alphabetical order, and the entry types are observable");
