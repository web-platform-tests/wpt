'use strict';

// Tests which patch the global environment are kept separate to avoid interfering with other tests.

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

// eslint-disable-next-line no-extend-native, accessor-pairs
Object.defineProperty(Object.prototype, 'highWaterMark', {
  set() { throw new Error('highWaterMark setter called'); }
});

// eslint-disable-next-line no-extend-native, accessor-pairs
Object.defineProperty(Object.prototype, 'size', {
  set() { throw new Error('size setter called'); }
});

test(() => {
  assert_not_equals(new TransformStream(), null, 'constructor should work');
}, 'TransformStream constructor should not call setters for highWaterMark or size');

done();
