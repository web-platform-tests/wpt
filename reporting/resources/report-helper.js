function wait(ms) {
  return new Promise(resolve => step_timeout(resolve, ms));
}

async function pollReports(endpoint, id, {min_count, timeout, retain_reports}) {
  let params = {};
  if (id) params.reportID = id;
  if (min_count) params.min_count = min_count;
  if (timeout) params.timeout = timeout;
  if (retain_reports) params.retain = 1;
  params = new URLSearchParams(params);
  const res = await fetch(`${endpoint}?${params.toString()}`,
                          { cache: 'no-store' });
  const reports = [];
  if (res.status === 200) {
    for (const report of await res.json()) {
      reports.push(report);
    }
  }
  return reports;
}

async function pollCookies(endpoint, id) {
  const res = await fetch(`${endpoint}?reportID=${id}&op=retrieve_cookies`, { cache: 'no-store' });
  const dict = await res.json();
  if (dict.reportCookies == 'None')
    return {};
  return dict.reportCookies;
}

async function pollNumResults(endpoint, id) {
  const res = await fetch(`${endpoint}?reportID=${id}&op=retrieve_count`, { cache: 'no-store' });
  const dict = await res.json();
  if (dict.report_count == 'None')
    return 0;
  return dict.report_count;
}

function checkReportExists(reports, type, url) {
  for (const report of reports) {
    if (report.type !== type) continue;
    if (report.body.documentURL == url || report.body.sourceFile === url) return true;
  }
  assert_unreached(`A report of ${type} from ${url} is not found.`);
}
