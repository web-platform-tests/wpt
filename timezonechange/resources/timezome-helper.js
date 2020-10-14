'use strict';

// These tests rely on the User Agent providing an implementation of
// platform time zone setter backends.
//
// In Chromium-based browsers this implementation is provided by a
// calling an internal function.

async function loadChromiumResources() {
  await loadScript('/resources/chromium/mock-time-zone-setter.js');
};

async function create_time_zone_setter() {
  if (typeof TimeZoneSetter === 'undefined') {
    if (isChromiumBased) {
      await loadChromiumResources();
    } else {
      throw new Error('testing interface is not available.');
    }
  }
  if (typeof TimeZoneSetter === 'undefined') {
    throw new Error('Failed to set up TimeZoneSetter.');
  }
  return new TimeZoneSetter();
}
