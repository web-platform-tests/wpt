'use strict';

async function waitForOrientationEvent(eventName) {
  if (eventName !== 'devicemotion' && eventName !== 'deviceorientation' && eventName !== 'deviceorientationabsolute') {
    return 'ERROR';
  }

  let value;

  try {
    // See https://github.com/w3c/deviceorientation/issues/148: the
    // specification currently does not fire any events when the permissions
    // policy checks fail, so what we do here is wait for the timeout and the
    // devicemotion event handler to race each other.
    value = await new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener(eventName, handler);
        reject('NO-EVENT');
      }, 1500);
      function handler(event) {
        window.clearTimeout(timeoutId);

        let data;
        switch (event.type) {
          case 'devicemotion':
            data = generateMotionData(
              event.acceleration.x,
              event.acceleration.y,
              event.acceleration.z,
              event.accelerationIncludingGravity.x,
              event.accelerationIncludingGravity.y,
              event.accelerationIncludingGravity.z,
              event.rotationRate.alpha,
              event.rotationRate.beta,
              event.rotationRate.gamma,
            );
            break;
          case 'deviceorientation':
          case 'deviceorientationabsolute':
            data = generateOrientationData(
              event.alpha,
              event.beta,
              event.gamma,
              event.absolute,
            );
            break;
          default:
            reject('UNEXPECTED-EVENT-TYPE');
            break;
        }
        resolve(JSON.stringify(data));
      }
      window.addEventListener(eventName, handler, { once: true });
    });
  } catch (e) {
    value = e;
  }

  return value;
}
