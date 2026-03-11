// META: title=CrashReportContext interface exposed on Window

/*
 * The CrashReportContext interface must be exposed on the Window global object.
 */

test(() => {
  assert_true('CrashReportContext' in window, "CrashReportContext should be present on the window object");
}, "CrashReportContext interface exposed on Window");