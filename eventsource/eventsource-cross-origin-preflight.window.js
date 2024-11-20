// META: title=EventSource: cross-origin preflight
// META: script=/common/utils.js

const crossdomain = location.href.replace('://', '://élève.').replace(/\/[^\/]*$/, '/')
const origin = location.origin.replace('://', '://xn--lve-6lad.')

;[
  ['safe `last-event-id` (no preflight)', 'safe'],
  ['unsafe `last-event-id` (too long)', 'long'],
  ['unsafe `last-event-id` (unsafe characters)', 'unsafe']
].forEach(([name, fixture]) => {
  async_test(document.title + ' - ' + name).step(function() {
    const uuid = token()
    const url = crossdomain + 'resources/cors-unsafe-last-event-id.py?fixture=' + fixture + '&token=' + uuid

    const source = new EventSource(url)

    // Make sure to close the EventSource after the test is done.
    this.add_cleanup(() => source.close())

    // 1. Event will be a `message` with `id` set to a CORS-safe value, then disconnects.
    source.addEventListener('message', this.step_func(e => assert_equals(e.data, fixture)))

    // 2. Will emit either `success` or `failure` event. We expect `success`,
    //    which is the case if `last-event-id` is set to the same value as received above,
    //    and a preflight request has been sent for the unsafe `last-event-id` headers.
    source.addEventListener('success', this.step_func_done())
    source.addEventListener('failure', (evt) => {
      this.step(() => assert_unreached(evt.data))
      this.done()
    })
  })
})
