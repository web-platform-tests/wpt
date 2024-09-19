// @ts-check
// Import the types from the TypeScript file
/**
 * @typedef {import('../dc-types').Protocol} Protocol
 * @typedef {import('../dc-types').DigitalCredentialsRequest} DigitalCredentialsRequest
 * @typedef {import('../dc-types').DigitalCredentialRequestOptions} DigitalCredentialRequestOptions
 * @typedef {import('../dc-types').CredentialRequestOptions} CredentialRequestOptions
 * @typedef {import('../dc-types').SendMessageData} SendMessageData
 */

/**
 * @param {Protocol | Protocol[]} [protocolsToUse=["default"]]
 * @param {CredentialMediationRequirement} [mediation="required"]
 * @returns {CredentialRequestOptions}
 */
export function makeGetOptions(
  protocolsToUse = ["default"],
  mediation = "required"
) {
  if (typeof protocolsToUse === "string") {
    if (protocolsToUse === "default" || protocolsToUse === "openid4vp") {
      return makeGetOptions([protocolsToUse]);
    }
  }
  if (!Array.isArray(protocolsToUse) || !protocolsToUse?.length) {
    return { digital: { requests: protocolsToUse }, mediation };
  }
  const requests = [];
  for (const provider of protocolsToUse) {
    switch (provider) {
      case "openid4vp":
        requests.push(makeOID4VPDict());
        break;
      case "default":
        requests.push(makeDigitalCredentialsRequest(undefined, undefined));
        break;
      default:
        throw new Error(`Unknown provider type: ${provider}`);
    }
  }
  return { digital: { requests }, mediation };
}
/**
 *
 * @param {string} protocol
 * @param {object} data
 * @returns {DigitalCredentialsRequest}
 */
function makeDigitalCredentialsRequest(protocol = "protocol", data = {}) {
  return {
    protocol,
    data,
  };
}

/**
 * Representation of a digital identity object with an OpenID4VP provider.
 *
 * @returns {DigitalCredentialsRequest}
 **/
function makeOID4VPDict() {
  return makeDigitalCredentialsRequest("openid4vp", {
    // Canonical example of an OpenID4VP request coming soon.
  });
}

/**
 * Sends a message to an iframe and return the response.
 *
 * @param {HTMLIFrameElement} iframe - The iframe element to send the message to.
 * @param {SendMessageData} data - The data to be sent to the iframe.
 * @returns {Promise<any>} - A promise that resolves with the response from the iframe.
 */
export function sendMessage(iframe, data) {
  return new Promise((resolve, reject) => {
    if (!iframe.contentWindow) {
      reject(
        new Error(
          "iframe.contentWindow is undefined, cannot send message (something is wrong with the test that called this)."
        )
      );
      return;
    }
    window.addEventListener("message", function messageListener(event) {
      if (event.source === iframe.contentWindow) {
        window.removeEventListener("message", messageListener);
        resolve(event.data);
      }
    });
    iframe.contentWindow.postMessage(data, "*");
  });
}

/**
 * Load an iframe with the specified URL and wait for it to load.
 *
 * @param {HTMLIFrameElement} iframe
 * @param {string|URL} url
 * @returns {Promise<void>}
 */
export function loadIframe(iframe, url) {
  return new Promise((resolve, reject) => {
    iframe.addEventListener("load", resolve, { once: true });
    iframe.addEventListener("error", reject, { once: true });
    if (!iframe.isConnected) {
      document.body.appendChild(iframe);
    }
    iframe.src = url.toString();
  });
}
