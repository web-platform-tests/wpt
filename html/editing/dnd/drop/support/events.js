setup({ explicit_timeout: true, single_test: true });
function rAF() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
}
const a = document.getElementById('a');
const b = document.getElementById('b');
const aActualEvents = [];
const bActualEvents = [];
const aExpectedEvents = a?.dataset.expectedEvents.split(',') || [];
const bExpectedEvents = b.dataset.expectedEvents.split(',');
for (const eventType of new Set([aExpectedEvents, ...bExpectedEvents])) {
  if (a) {
    a.addEventListener(eventType, e => {
      aActualEvents.push(e.type);
    });
  }
  b.addEventListener(eventType, async (e) => {
    bActualEvents.push(e.type);
    if (e.type === "input") {
      await rAF();
      await rAF();
      assert_array_equals(aActualEvents, aExpectedEvents);
      assert_array_equals(bActualEvents, bExpectedEvents);
      done();
    }
  });
}
const dragMeElement = document.querySelector('[data-select]');
const [selectionStart, selectionEnd] = dragMeElement.dataset.select.split(',').map(s => parseInt(s, 10));
setSelection(dragMeElement, selectionStart, selectionEnd);
dragMeElement.focus();
