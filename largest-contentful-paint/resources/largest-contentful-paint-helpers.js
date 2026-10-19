// Shared helpers for the largest-contentful-paint tests: observing entries,
// checking their properties as individual subtests, and the image-upscaling
// test suite.

const image_delay = 2000;
const delay_pipe_value = image_delay / 1000;

// ---------------------------------------------------------------------------
// Entry filters
// ---------------------------------------------------------------------------

// |filter| selects which largest-contentful-paint entries to consider:
//   * undefined: any entry,
//   * an object with 'url' and/or 'id' properties: entries matching all of the
//     given properties (the empty string matches text entries),
//   * a predicate function taking the entry.
const matchesFilter = (entry, filter) => {
  if (filter === undefined)
    return true;
  if (typeof filter === 'function')
    return filter(entry);
  if ('url' in filter && entry.url.substr(0, 100) !== filter.url.substr(0, 100))
    return false;
  if ('id' in filter && entry.id !== filter.id)
    return false;
  return true;
};

const describeFilter = filter => {
  if (filter === undefined)
    return 'any entry';
  if (typeof filter === 'function')
    return 'the expected entry';
  const parts = [];
  if ('url' in filter)
    parts.push(`url ${filter.url}`);
  if ('id' in filter)
    parts.push(`id ${filter.id}`);
  return parts.join(' and ') || 'any entry';
};

// ---------------------------------------------------------------------------
// Observing entries
// ---------------------------------------------------------------------------

// Resolves with the first largest-contentful-paint entry matching |filter|,
// including entries buffered before this call. Can be called during script
// evaluation, before an entry is expected; use awaitEntry() to fail with a
// descriptive error if no entry arrives.
const observeLCP = filter => {
  return new Promise(resolve => {
    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (matchesFilter(entry, filter)) {
          observer.disconnect();
          resolve(entry);
          return;
        }
      }
    });
    observer.observe({type: 'largest-contentful-paint', buffered: true});
  });
};

// Resolves with an array of the first |count| entries matching |filter|.
const observeLCPEntries = (count, filter) => {
  return new Promise(resolve => {
    const entries = [];
    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (!matchesFilter(entry, filter))
          continue;
        entries.push(entry);
        if (entries.length === count) {
          observer.disconnect();
          resolve(entries);
          return;
        }
      }
    });
    observer.observe({type: 'largest-contentful-paint', buffered: true});
  });
};

// Awaits |entryPromise| within test |t|, rejecting with a TimeoutError carrying
// |message| if no entry has been observed after |timeout| ms.
const awaitEntry = async (t, entryPromise, message, timeout = 5000) => {
  let timeout_id;
  const timeoutPromise = new Promise((_, reject) => {
    timeout_id = t.step_timeout(
        () => reject(new DOMException(message, 'TimeoutError')), timeout);
  });
  try {
    return await Promise.race([entryPromise, timeoutPromise]);
  } finally {
    clearTimeout(timeout_id);
  }
};

// ---------------------------------------------------------------------------
// Checking entries
// ---------------------------------------------------------------------------

// Checks the PaintTimingMixin relationships of |entry|:
// https://w3c.github.io/paint-timing/#sec-performancepainttiming
// |timeLowerBound| is a lower bound on the time the entry was painted.
const checkPaintTiming = (entry, timeLowerBound) => {
  if (!('paintTime' in entry) || entry.paintTime === null) {
    // Implementations that do not expose paintTime cannot be checked for the
    // mixin relationships; renderTime is still expected to be after the bound.
    assert_greater_than_equal(entry.renderTime, timeLowerBound,
        'renderTime should be after the lower bound');
    return;
  }
  assert_greater_than_equal(entry.paintTime, timeLowerBound,
      'paintTime should represent the time when the UA started painting');
  if ('presentationTime' in entry && entry.presentationTime !== null) {
    assert_greater_than(entry.presentationTime, entry.paintTime);
    assert_equals(entry.presentationTime, entry.renderTime);
  } else {
    assert_equals(entry.renderTime, entry.paintTime);
  }
};

// Checks the properties of |entry|; a mismatch throws, failing the calling
// test.
//
// |expectedUrl| is the entry's url ('' for text entries).
// |expectedID| is the entry's id; unless 'skipElement' is passed, the entry's
//     element is checked against document.getElementById(expectedID).
// |expectedSize| is the entry's size, interpreted according to |options|; it
//     may be a function returning the (previously computed) value.
// |timeLowerBound| is a lower bound on the paint time of the entry, given as a
//     number or a function returning the (previously recorded) number.
//
// |options| may contain:
//   'text': the entry describes a text element (loadTime must be 0).
//   'sizeLowerBound': |expectedSize| is a lower bound on the size (inclusive).
//   'approximateSize': |expectedSize| is approximate.
//   'sizeRange': |expectedSize| is a [min, max] array.
//   'skipSize': the size is not checked.
//   'skipElement': the element is not checked (e.g. entries serialized via
//       toJSON() do not carry one).
//   'skipTiming': the time-related properties are not checked.
//   'skipLoadTime': the loadTime is not checked (e.g. CSS background images
//       can report 0).
//   'animated': the entry describes an animated image; renderTime must be
//       positive and smaller than the delay applied to the second frame.
const checkEntry = (entry, expectedUrl, expectedID, expectedSize,
                    timeLowerBound, options = []) => {
  const size = () => typeof expectedSize === 'function' ? expectedSize() : expectedSize;
  const lowerBound = () => typeof timeLowerBound === 'function' ? timeLowerBound() : timeLowerBound;

  assert_equals(entry.name, '', 'Entry name should be the empty string');
  assert_equals(entry.entryType, 'largest-contentful-paint',
      'Entry type should be largest-contentful-paint');
  assert_equals(entry.duration, 0, 'Entry duration should be 0');
  // The entry's url can be truncated.
  assert_equals(expectedUrl.substr(0, 100), entry.url.substr(0, 100),
      `Expected URL ${expectedUrl} should at least start with the entry's URL ${entry.url}`);
  assert_equals(entry.id, expectedID, 'Entry ID matches expected one');
  if (!options.includes('skipElement')) {
    assert_equals(entry.element, document.getElementById(expectedID),
        'Entry element is expected one');
  }

  if (!options.includes('skipSize')) {
    if (options.includes('sizeLowerBound')) {
      assert_greater_than_equal(entry.size, size());
    } else if (options.includes('approximateSize')) {
      assert_approx_equals(entry.size, size(), 1);
    } else if (options.includes('sizeRange')) {
      assert_greater_than_equal(entry.size, size()[0],
          'Size should be within the expected range');
      assert_less_than_equal(entry.size, size()[1],
          'Size should be within the expected range');
    } else {
      assert_equals(entry.size, size());
    }
  }

  if (!options.includes('skipTiming')) {
    assert_greater_than_equal(performance.now(), entry.renderTime,
        'renderTime should occur before the entry is dispatched to the observer.');
    assert_approx_equals(entry.startTime, entry.renderTime, 0.001,
        'startTime should be equal to renderTime to the precision of 1 millisecond.');
    checkPaintTiming(entry, lowerBound());
    if (options.includes('animated')) {
      assert_less_than(entry.renderTime, image_delay,
          'renderTime should be smaller than the delay applied to the second frame');
      assert_greater_than(entry.renderTime, 0,
          'renderTime should be larger than 0');
    } else if (options.includes('text')) {
      assert_equals(entry.loadTime, 0, 'Entry loadTime should be 0');
    } else if (!options.includes('skipLoadTime')) {
      assert_between_inclusive(entry.loadTime, lowerBound(), entry.renderTime,
          'loadTime should occur between the lower bound and the renderTime');
    }
  }
};

// Registers a promise_test that fails if any largest-contentful-paint entry
// matching |filter| is observed within |duration| ms.
const assertNoLCPEntry = (filter, {duration = 500, name} = {}) => {
  promise_test(async t => {
    const entries = [];
    const observer = new PerformanceObserver(entryList => {
      entries.push(...entryList.getEntries().filter(
          entry => matchesFilter(entry, filter)));
    });
    observer.observe({type: 'largest-contentful-paint', buffered: true});
    await new Promise(resolve => t.step_timeout(resolve, duration));
    observer.disconnect();
    assert_equals(entries.length, 0,
        `Should not have observed an LCP entry with ${describeFilter(filter)}; ` +
        `observed: ${entries.map(entry => entry.id || '(text)').join(', ')}`);
  }, name || `No LCP entry (${describeFilter(filter)}) within ${duration}ms`);
};

// Collects largest-contentful-paint entries matching |filter| until none have
// arrived for |settleMs| ms after the first one, then resolves with them.
// Must be called from within test |t|; rejects if no entry has been observed
// after |timeout| ms.
const collectLCPEntries = (t, {filter, settleMs = 200, timeout = 5000} = {}) => {
  return new Promise((resolve, reject) => {
    const entries = [];
    let settle_id = null;
    let timeout_id = null;
    const observer = new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        if (!matchesFilter(entry, filter))
          continue;
        entries.push(entry);
        // Once an entry has been observed the no-entry timeout is moot.
        if (timeout_id !== null) {
          clearTimeout(timeout_id);
          timeout_id = null;
        }
        // Wait a little longer so that additional entries, if any, are
        // observed before resolving.
        if (settle_id !== null)
          clearTimeout(settle_id);
        settle_id = t.step_timeout(() => {
          clearTimeout(timeout_id);
          observer.disconnect();
          resolve(entries);
        }, settleMs);
      }
    });
    observer.observe({type: 'largest-contentful-paint', buffered: true});
    timeout_id = t.step_timeout(() => {
      observer.disconnect();
      reject(new DOMException(`No LCP entry observed (${describeFilter(filter)})`,
          'TimeoutError'));
    }, timeout);
  });
};

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

// Creates an <img> for |src| with the given attributes, appends it to
// |container| and returns it.
const appendImage = (src, {id, width, height, style, container = document.body} = {}) => {
  const img = document.createElement('img');
  if (id !== undefined)
    img.id = id;
  img.src = src;
  if (width !== undefined)
    img.width = width;
  if (height !== undefined)
    img.height = height;
  if (style !== undefined)
    Object.assign(img.style, style);
  container.appendChild(img);
  return img;
};

const load_and_observe = url => {
  return new Promise(resolve => {
    (new PerformanceObserver(entryList => {
      for (let entry of entryList.getEntries()) {
        if (entry.url == url) {
          resolve(entryList.getEntries()[0]);
        }
      }
    })).observe({ type: 'largest-contentful-paint', buffered: true });
    const img = new Image();
    img.id = 'image_id';
    img.src = url;
    document.body.appendChild(img);
  });
};

const load_video_and_observe = url => {
  return new Promise(resolve => {
    (new PerformanceObserver(entryList => {
      for (let entry of entryList.getEntries()) {
        if (entry.url == url) {
          resolve(entryList.getEntries()[0]);
        }
      }
    })).observe({ type: 'largest-contentful-paint', buffered: true });
    const video = document.createElement("video");
    video.id = 'video_id';
    video.src = url;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    document.body.appendChild(video);
  });
};

const raf = () => {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

// ---------------------------------------------------------------------------
// Image upscaling tests
// ---------------------------------------------------------------------------

// Shared tests for image-upscaling.html and image-upscaling-empty-url.html:
// the two files differ only in how the popup hosting the image is opened, so
// all checks live here. Must be called after testharness.js, testdriver.js and
// /common/utils.js (for token()) are loaded. |openPopup| opens the popup
// window that hosts the tested image.
const run_image_upscaling_tests = openPopup => {
  const imageURL = `${window.location.origin}/images/blue.png`;

  async function load_image_and_get_lcp_size(t, imageStyle = {}, containerStyle = {}) {
    let popup;
    await test_driver.bless('Open a popup', () => {
      popup = openPopup();
      t.add_cleanup(() => popup.close());
    });

    // Ensure the popup document is ready before manipulating it.
    // Per spec, about:blank should load synchronously and should be
    // immediately ready. In older Gecko versions this may not be the case,
    // so we wait for pageshow if needed.
    if (popup.document.readyState !== 'complete') {
      await new Promise((resolve) =>
        popup.addEventListener('pageshow', resolve, { once: true })
      );
    }

    const image = popup.document.createElement('img');
    image.src = imageURL;

    // We decode the image to get the natural size (though it's a constant)
    await image.decode();
    const naturalSize = image.width * image.height;
    const container = popup.document.createElement('div');
    container.appendChild(image);

    const applyStyle = (el, style = {}) =>
      Object.entries(style).forEach(([k, v]) => el.style.setProperty(k, v));
    applyStyle(image, imageStyle);
    applyStyle(container, containerStyle);
    image.id = token();
    container.id = token();

    const entryReported = new Promise(resolve =>
      new popup.PerformanceObserver(entryList => {
        entryList.getEntries().forEach(entry => {
          if (entry.id === image.id || entry.id === container.id) {
            resolve(entry.size);
          }
        });
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    );

    popup.document.body.appendChild(container);

    return {
      lcpSize: await entryReported,
      naturalSize
    };
  }

  /* We set the image to display: none when testing background,
  so that only the background is reported
  and not the image itself */
  const load_background_image_and_get_lcp_size = (t, style) =>
    load_image_and_get_lcp_size(t, { display: 'none' }, {
      position: 'absolute',
      'background-image': `url(${imageURL})`,
      ...style,
    });

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t);
    assert_equals(lcpSize, naturalSize);
  }, 'Non-scaled image should report the natural size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { width: '50px', height: '50px' });
    assert_equals(lcpSize, 50 * 50);
  }, 'A downscaled image (width/height) should report the displayed size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { transform: 'scale(0.5)' });
    assert_approx_equals(Math.floor(lcpSize), Math.floor(naturalSize / 4), 2);
  }, 'A downscaled image (using scale) should report the displayed size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { width: '500px', height: '500px' });
    assert_equals(lcpSize, naturalSize);
  }, 'An upscaled image (width/height) should report the natural size');

  /* TODO(crbug.com/1484431):
  Need to dig deeper into this test, to verify the implementation of scale()
  Currently unable to upscale image*/
  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { transform: 'scale(1.0)' });
    assert_equals(Math.floor(lcpSize), Math.floor(naturalSize));
  }, 'An upscaled image (using scale) should report the natural size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { 'object-size': '300px 300px' });
    assert_equals(Math.floor(lcpSize), Math.floor(naturalSize));
  }, 'An upscaled image (using object-size) should report the natural size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_image_and_get_lcp_size(t,
      { 'object-position': '-100px 0' });
    assert_equals(lcpSize, 3498);
  }, 'Intersecting element with partial-intersecting image to report image intersection');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_background_image_and_get_lcp_size(t,
      { width: '50px', height: '50px' });
    assert_equals(lcpSize, 50 * 50);
  }, 'A background image larger than the container should report the container size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_background_image_and_get_lcp_size(t,
      { width: '300px', height: '300px' });
    assert_equals(lcpSize, naturalSize);
  }, 'A background image smaller than the container should report the natural size');

  promise_test(async t => {
    const { naturalSize, lcpSize } = await load_background_image_and_get_lcp_size(t,
      {
        width: '300px',
        height: '300px',
        'background-size': '10px 10px',
        'background-repeat': 'no-repeat'
      });
    assert_equals(lcpSize, 100);
  }, 'A scaled-down background image should report the background size');
};
