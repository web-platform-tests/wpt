"use strict";

function canOpenPopup() {
  let popup = window.open("about:blank", "_blank");
  if (popup) {
    popup.close();
    return true;
  }
  return false;
}

function appendButton(buttonText, onClickCallback) {
    let button = document.createElement("button");
    button.textContent = buttonText;
    button.onclick = onClickCallback;
    document.body.appendChild(button);
    return button;
}
