"use strict";

self.testSharingViaIncrementerScript = (t, whereToListen, whereToListenLabel, whereToSend, whereToSendLabel, origin) => {
  return new Promise(resolve => {
    const sab = new SharedArrayBuffer(4);
    const view = new Int32Array(sab);
    view[0] = 1;

    whereToListen.onmessage = t.step_func(({ data }) => {
      switch (data.message) {
        case "initial payload received": {
          assert_equals(data.value, 1, `The ${whereToSendLabel} must see the same value in the SharedArrayBuffer`);
          break;
        }

        case "changed to 2": {
          assert_equals(view[0], 2, `The ${whereToListenLabel} must see changes made in the ${whereToSendLabel}`);

          view[0] = 3;
          whereToSend.postMessage({ message: "changed to 3" }, origin);

          break;
        }

        case "changed to 3 received": {
          assert_equals(data.value, 3, `The ${whereToSendLabel} must see changes made in the ${whereToListenLabel}`);
          resolve();
          break;
        }
      }
    });

    whereToSend.postMessage({ message: "initial payload", sab }, origin);
  });
};

self.setupDestinationIncrementer = (whereToListen, whereToSendBackTo, origin) => {
  let view;
  whereToListen.onmessage = ({ data }) => {
    switch (data.message) {
      case "initial payload": {
        view = new Int32Array(data.sab);
        whereToSendBackTo.postMessage({ message: "initial payload received", value: view[0] }, origin);

        view[0] = 2;
        whereToSendBackTo.postMessage({ message: "changed to 2" }, origin);

        break;
      }

      case "changed to 3": {
        whereToSendBackTo.postMessage({ message: "changed to 3 received", value: view[0] }, origin);

        break;
      }
    }
  };
};
