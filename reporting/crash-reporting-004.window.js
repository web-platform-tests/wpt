// META: title=CrashReportContext has initialize method

/*
 * The CrashReportContext interface must have an initialize method.
 */

test(() => {
  assert_true('CrashReportContext' in window, 'CrashReportContext must be exposed on the Window object.');
  assert_equals(typeof CrashReportContext.prototype.initialize, 'function', 'CrashReportContext.prototype.initialize must be a function.');
}, "CrashReportContext has initialize method");