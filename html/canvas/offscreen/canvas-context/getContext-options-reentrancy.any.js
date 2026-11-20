// META: title=OffscreenCanvas getContext(): script that runs while options are converted
'use strict';

// Converting the options argument of getContext() to a dictionary can run script. If that script
// changes the context mode of the OffscreenCanvas, the outer getContext() call has to act on the
// new context mode rather than create a second rendering context.

const contextIds = ['2d', 'bitmaprenderer', 'webgl', 'webgl2'];

const interfaceNames = {
  '2d': 'OffscreenCanvasRenderingContext2D',
  'bitmaprenderer': 'ImageBitmapRenderingContext',
  'webgl': 'WebGLRenderingContext',
  'webgl2': 'WebGL2RenderingContext',
};

const webglSupport = {};
for (const contextId of ['webgl', 'webgl2']) {
  webglSupport[contextId] = new OffscreenCanvas(10, 10).getContext(contextId) !== null;
}

function requireContextId(contextId) {
  if (contextId in webglSupport) {
    assert_implements_optional(webglSupport[contextId], `getContext("${contextId}") is supported`);
  }
}

// Returns options whose getters run callback the first time any of them is invoked. Not every
// context type (or implementation) reads alpha, but they all read alpha or willReadFrequently.
function optionsWithGetter(callback) {
  const state = { called: false };
  const run = value => {
    if (!state.called) {
      state.called = true;
      callback();
    }
    return value;
  };
  const options = {
    get alpha() { return run(true); },
    get willReadFrequently() { return run(false); },
  };
  return { options, state };
}

for (const outerId of contextIds) {
  for (const innerId of contextIds) {
    test(() => {
      requireContextId(outerId);
      requireContextId(innerId);

      const canvas = new OffscreenCanvas(10, 10);
      let innerContext;
      const { options, state } = optionsWithGetter(() => {
        innerContext = canvas.getContext(innerId);
      });
      const outerContext = canvas.getContext(outerId, options);

      assert_true(state.called, 'an options getter was invoked');
      assert_true(innerContext instanceof self[interfaceNames[innerId]],
                  `inner getContext("${innerId}") returns a ${interfaceNames[innerId]}`);
      if (outerId === innerId) {
        assert_equals(outerContext, innerContext,
                      'outer getContext() returns the context created by the inner call');
      } else {
        assert_equals(outerContext, null, 'outer getContext() returns null');
      }
      assert_equals(canvas.getContext(innerId), innerContext,
                    'later getContext() calls return the context created by the inner call');
    }, `getContext("${outerId}") whose options getter calls getContext("${innerId}")`);
  }
}

for (const contextId of contextIds) {
  test(() => {
    requireContextId(contextId);

    const canvas = new OffscreenCanvas(10, 10);
    let transferredCanvas;
    const { options } = optionsWithGetter(() => {
      transferredCanvas = structuredClone(canvas, { transfer: [canvas] });
    });
    assert_throws_dom('InvalidStateError', () => canvas.getContext(contextId, options));
    assert_true(transferredCanvas instanceof OffscreenCanvas,
                'transferring the OffscreenCanvas succeeds');
  }, `getContext("${contextId}") whose options getter transfers the OffscreenCanvas`);
}

for (const contextId of contextIds) {
  test(() => {
    requireContextId(contextId);

    const canvas = new OffscreenCanvas(10, 10);
    const error = new Error('options getter');
    const { options } = optionsWithGetter(() => {
      throw error;
    });
    assert_throws_exactly(error, () => canvas.getContext(contextId, options));

    const otherId = contextId === '2d' ? 'bitmaprenderer' : '2d';
    assert_true(canvas.getContext(otherId) instanceof self[interfaceNames[otherId]],
                `getContext("${otherId}") returns a ${interfaceNames[otherId]}`);
  }, `getContext("${contextId}") whose options getter throws leaves the context mode as none`);
}
