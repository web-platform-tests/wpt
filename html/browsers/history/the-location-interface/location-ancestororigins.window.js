test(() => {
  assert_equals(location.ancestorOrigins.length, 0)
}, "location.ancestorOrigins basic check")

async_test(t => {
  const frame = document.createElement("iframe"),
        rp = document.createElement("meta")
  frame.onload = t.step_func_done(() => {
    const ancestorOrigins = frame.contentWindow.location.ancestorOrigins
    assert_equals(ancestorOrigins[0], self.origin)
    assert_equals(ancestorOrigins.length, 1)

    rp.name = "referrer"
    rp.content = "no-referrer"
    document.head.appendChild(rp)
    assert_equals(self[0].location.ancestorOrigins, ancestorOrigins)
    assert_equals(ancestorOrigins[0], self.origin)
    assert_equals(ancestorOrigins.length, 1)
    rp.remove()

    frame.referrerPolicy = "no-referrer"
    assert_equals(self[0].location.ancestorOrigins, ancestorOrigins)
    assert_equals(ancestorOrigins[0], self.origin)
    assert_equals(ancestorOrigins.length, 1)

    frame.remove()
  })
  frame.src = "/common/blank.html"
  document.body.appendChild(frame)
}, "location.ancestorOrigins cannot be masked by a dynamic referrer policy")

async_test(t => {
  const frame = document.createElement("iframe")
  frame.onload = t.step_func_done(() => {
    const ancestorOrigins = frame.contentWindow.location.ancestorOrigins
    assert_equals(ancestorOrigins[0], "null")
    assert_equals(ancestorOrigins.length, 1)
    frame.remove()
  })
  frame.src = "/common/blank.html"
  frame.referrerPolicy = "no-referrer"
  document.body.appendChild(frame)
}, "location.ancestorOrigins can be masked by a predetermined referrer policy")
