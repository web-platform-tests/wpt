const is_worker = !('window' in self);
const parent_or_self = is_worker ? self : self.parent;

function startWorkerAndObserveReports(worker_url, wait_for_report) {
  const worker = new Worker(worker_url);
  const result_promise = new Promise(resolve => {
    worker.onmessage = _ => resolve('success');
    worker.onerror = _ => resolve('error');
  });
  worker.postMessage("postMessage('reply to frame from worker');");

  const report_promise = new Promise(resolve => {
    const observer = new ReportingObserver(reports => {
      observer.disconnect();
      resolve(reports.map(r => r.toJSON()));
    });
    observer.observe();
  });

  if (wait_for_report) {
    /* Remove this part before merging */
    /* Mock sending a result so we know the test works at all
       because no browser supports COEP reports in workers right now */
    parent_or_self.postMessage([
      {
        type:'coep',
        url:location.href,
        body: {
          type:"worker initialization",
          blockedURL: new URL(worker_url, location.href).href,
          disposition:"reporting" // some tests expect "enforce", so they should fail
        }
      }
    ]);
    return;
    /* End part to remove before merging */
    Promise.all([result_promise, report_promise]).then(results => {
      parent_or_self.postMessage(results[1]);
    });
  } else {
    result_promise.then(result => {
      parent_or_self.postMessage([]);
    });
  }
}

if (is_worker) {
  onmessage = e => {
    startWorkerAndObserveReports(e.data.worker_url, e.data.wait_for_report);
  };
}
