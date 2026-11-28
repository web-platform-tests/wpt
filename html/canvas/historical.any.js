// removed in https://github.com/whatwg/html/pull/9979
test(() => {
  assert_equals(OffscreenCanvasRenderingContext2D.prototype.commit, undefined);
}, "OffscreenCanvasRenderingContext2D.commit method is removed");

// removed in https://github.com/whatwg/html/commit/c7ad0990516bae9d1bc3009145a8bcde523b584d
// (revert of CanvasFilter objects as possible 2D context filters)
test(() => {
  assert_equals(self.CanvasFilter, undefined);
}, "CanvasFilter interface is removed");
