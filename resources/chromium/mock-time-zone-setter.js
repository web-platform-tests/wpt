'use strict';

const TimeZoneSetter = (() => {

  class TimeZoneSetterChromium {
    constructor() {
      Object.freeze(this); // Make it immutable.
    }

    setSystemTimeZoneForTesting(timezone) {
      internals.setSystemTimeZone(timezone);
    }
  }

  return TimeZoneSetterChromium;
})();
