"use strict";

let view;
self.onmessage = ({ data }) => {
  switch (data.message) {
    case "initial payload": {
      view = new Int32Array(data.sab);
      self.postMessage({ message: "initial payload received", value: view[0] });

      view[0] = 2;
      self.postMessage({ message: "changed to 2" });

      break;
    }

    case "changed to 3": {
      self.postMessage({ message: "changed to 3 received", value: view[0] });

      break;
    }
  }
};
