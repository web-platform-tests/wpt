
// Structure:
// <div #aboveHost>
// <div #host>
//    #shadowRoot
//      <div #aboveSlot>
//      <slot #slotAbove>
//        (slotted) <div #slottedAbove>
//      <slot #slotBelow>
//        (slotted) <div #slottedBelow>
//      <div #belowSlot>
// <div #belowHost>
function prepareDOM(container, delegatesFocus) {

  const aboveHost = document.createElement("div");
  aboveHost.innerText = "aboveHost";
  const host = document.createElement("div");
  host.id = "host";
  const slottedBelow = document.createElement("div");
  slottedBelow.innerText = "slotted below";
  slottedBelow.slot = "below";
  const slottedAbove = document.createElement("div");
  slottedAbove.innerText = "slotted above";
  slottedAbove.slot = "above";

  const belowHost = document.createElement("div");
  belowHost.innerText = "belowHost";
  container.appendChild(aboveHost);
  container.appendChild(host);
  container.appendChild(belowHost);
  host.appendChild(slottedBelow);
  host.appendChild(slottedAbove);
  const shadowRoot = host.attachShadow({ mode: "open", delegatesFocus: delegatesFocus});
  const aboveSlot = document.createElement("div");
  aboveSlot.innerText = "aboveSlot";

  const slotAbove = document.createElement("slot");
  slotAbove.name = "above";
  const slotBelow = document.createElement("slot");
  slotBelow.name = "below";

  const belowSlot = document.createElement("div");
  belowSlot.innerText = "belowSlot";
  shadowRoot.appendChild(aboveSlot);
  shadowRoot.appendChild(slotAbove);
  shadowRoot.appendChild(slotBelow);
  shadowRoot.appendChild(belowSlot);

  return [aboveHost, host, aboveSlot, slotAbove, slottedAbove, slotBelow, slottedBelow, belowSlot, belowHost];
}

function setTabIndex(elements, value) {
  for (let el of elements) {
    el.tabIndex = value;
  }
}

function removeTabIndex(elements) {
  for (let el of elements) {
    el.removeAttribute("tabindex");
  }
}

function resetFocus() {
  document.body.focus();
}

function navigateFocusForward() {
  // TAB = '\ue004'
  return test_driver.send_keys(document.body, "\ue004");
}

function assertFocusOrder(expectedOrder) {
  let shadowRoot = document.getElementById("host").shadowRoot;
  return new Promise(async (resolve, reject) => {
    for (let el of expectedOrder) {
      await navigateFocusForward();
      let focused = shadowRoot.activeElement ? shadowRoot.activeElement : document.activeElement;
      assert_equals(focused, el);
    }
    resolve();
  });
}