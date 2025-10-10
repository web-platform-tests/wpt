const effectAllowedList = ["uninitialized", "undefined", "none", "all",
  "copy",
  "move", "link", "copyMove", "copyLink", "linkMove", "dummy"
];

function dropEffectOnDropCallBack(event) {
  assert_equals(event.target.textContent, event.dataTransfer.dropEffect);
  assert_equals(event.target.textContent, event.dataTransfer.effectAllowed);
  return true;
}

function buildEffectAllowedDivs() {
  effectAllowedList.forEach(effectAllowed => {
    document.getElementById('drag-container').innerHTML +=
      `<div id="drag-${effectAllowed}" draggable="true" ondragstart="event.dataTransfer.effectAllowed = '${effectAllowed}'">${effectAllowed}</div>`;
  });
}

function expectedDropEffectForEffectAllowed(chosenDropEffect,
  chosenEffectAllowed) {
  if (chosenDropEffect == "dummy") {
    switch (chosenEffectAllowed) {
      case "undefined":
      case "copyLink":
      case "copyMove":
      case "uninitialized":
      case "all":
        return "copy";
      case "linkMove":
        return "link";
      case "move":
        return "move";
      default:
        return chosenEffectAllowed;
    }
  }
  return chosenDropEffect;
}

function dropEventShouldBeSent(dropEffect, effectAllowed) {
  dropEffect = expectedDropEffectForEffectAllowed(dropEffect, effectAllowed);
  if (effectAllowed === 'dummy' || effectAllowed === 'undefined') {
    effectAllowed = 'uninitialized';
  }
  if (effectAllowed === 'none' || dropEffect === 'none') {
    return false;
  }
  if (effectAllowed === 'uninitialized' || effectAllowed === 'all') {
    return true;
  }
  // Matches cases like `copyLink` / `link`.
  if (effectAllowed.toLowerCase().includes(dropEffect)) {
    return true;
  }
  return false;
}

function onDropCallBack(event, chosenDropEffect, chosenEffectAllowed) {
  const actualDropEffect = event.dataTransfer.dropEffect;
  const actualEffectAllowed = event.dataTransfer.effectAllowed;
  let expectedEffectAllowed = chosenEffectAllowed;
  if (chosenEffectAllowed === 'dummy' || chosenEffectAllowed ===
    'undefined') {
    expectedEffectAllowed = 'uninitialized';
  }
  assert_equals(actualEffectAllowed, expectedEffectAllowed,
    `effectAllowed: expected ${expectedEffectAllowed} but got ${actualEffectAllowed}`
  );
  let expectedDropEffect = expectedDropEffectForEffectAllowed(
    chosenDropEffect, actualEffectAllowed);
  // dragend events with invalid dropEffect-effectAllowed combinations have a
  // `none` dropEffect.
  if (!dropEventShouldBeSent(chosenDropEffect, chosenEffectAllowed)) {
    expectedDropEffect = 'none';
  }
  assert_equals(actualDropEffect, expectedDropEffect,
    `dropEffect: expected ${expectedDropEffect} but got ${actualDropEffect}`);
  return true;
}

function onDragOver(event, dropEffect) {
  event.dataTransfer.dropEffect = dropEffect;
  event.preventDefault();
}

// This function creates the divs with all the effectAlloweds defined in
// `effectAllowedList` and runs a drag and drop test that verifies that
// the correct events are sent (or not) depending on the combination of
// `dropEffect` and all the possible `effectAllowed`s.
// `testDropEvent`: boolean that decides if the function will test the
//                  `ondrop` event on the drop target, or the `dragend`
//                  event on the drag element.
// `dropEffect`: string with the `dropEffect` that will be matched against
//               the different `effectAllowed`s.
function runDropEffectTest(testDropEvent, dropEffect) {
  buildEffectAllowedDivs();
  effectAllowedList.forEach(effectAllowed => {
    const dragDiv = document.getElementById("drag-" +
      effectAllowed);
    const dropDiv = document.getElementById("drop-" + dropEffect);
    if (testDropEvent) {
      runDropTest(dragDiv, dropDiv, effectAllowed, dropEffect);
    } else {
      dragEndTest(dragDiv, dropDiv, (e) => onDropCallBack(e,
          dropEffect, effectAllowed),
        `${effectAllowed} / ${dropEffect}`);
    }
  });
}

function runDropTest(dragDiv, dropDiv, effectAllowed, dropEffect) {
  const shouldReceiveDropEvent = dropEventShouldBeSent(dropEffect,
    effectAllowed);
  if (shouldReceiveDropEvent) {
    dragDropTest(dragDiv, dropDiv, (e) => onDropCallBack(e,
        dropEffect, effectAllowed),
      `${effectAllowed} / ${dropEffect}`);
  } else {
    dragDropTestNoDropEvent(dragDiv, dropDiv,
      `${effectAllowed} / ${dropEffect}`);
  }
}
