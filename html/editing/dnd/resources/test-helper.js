'use strict';

// Gets the coordinates for the center of `element`. If `element` is contained
// within an `iframe`, use the `iframe` parameter to indicate which `iframe`
// contains `element`.
const getCenter = (element, iframe = undefined) => {
  let clientRect = element.getBoundingClientRect();
  let centerX = (clientRect.left + clientRect.right) / 2;
  let centerY = (clientRect.top + clientRect.bottom) / 2;
  if(iframe != undefined) {
    clientRect = iframe.getBoundingClientRect();
    centerX += clientRect.left;
    centerY += clientRect.top;
  }
  return [centerX, centerY];
};

// The dragDropTest function can be used for tests which require the drag and drop movement.
// `dragElement` takes the element that needs to be dragged and `dropElement` is the element which
// you want to drop the `dragElement` on. `onDropCallback` is called on the onDrop handler and the
// test will only pass if this function returns true. Also, if the `dropElement` is inside an
// iframe, use the optional `iframe` parameter to specify an iframe element that contains the
// `dropElement` to ensure that tests with an iframe pass.
function dragDropTest(dragElement, dropElement, onDropCallBack, testDescription, iframe = undefined) {
  promise_test((t) => new Promise(async (resolve, reject) => {
    dropElement.addEventListener('drop', t.step_func((event) => {
      if (onDropCallBack(event) == true) {
        resolve();
      } else {
        reject();
      }
    }));
    try {
      await new test_driver.Actions()
      .pointerMove(...getCenter(dragElement))
      .pointerDown()
      .pointerMove(...getCenter(dropElement, iframe))
      .pointerUp()
      .send();
    } catch (e) {
      reject(e);
    }
  }, testDescription));
}
