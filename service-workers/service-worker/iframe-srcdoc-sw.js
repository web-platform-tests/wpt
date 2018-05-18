importScripts('/resources/testharness.js')

async_test((test) => {
  addEventListener('fetch', (event) => {
    if (event.request.url.indexOf('square') > -1) {
      test.done()
    }
  })
})
