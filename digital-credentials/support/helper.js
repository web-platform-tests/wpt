// @ts-check
// Import the types from the TypeScript file
/**
 * @typedef {import('../dc-types').GetProtocol} GetProtocol
 * @typedef {import('../dc-types').DigitalCredentialGetRequest} DigitalCredentialGetRequest
 * @typedef {import('../dc-types').DigitalCredentialRequestOptions} DigitalCredentialRequestOptions
 * @typedef {import('../dc-types').CredentialRequestOptions} CredentialRequestOptions
 * @typedef {import('../dc-types').CreateProtocol} CreateProtocol
 * @typedef {import('../dc-types').DigitalCredentialCreateRequest} DigitalCredentialCreateRequest
 * @typedef {import('../dc-types').CredentialCreationOptions} CredentialCreationOptions
 * @typedef {import('../dc-types').DigitalCredentialCreationOptions} DigitalCredentialCreationOptions
 * @typedef {import('../dc-types').SendMessageData} SendMessageData
 * @typedef {import('../dc-types').MakeGetOptionsConfig} MakeGetOptionsConfig
 * @typedef {import('../dc-types').MakeCreateOptionsConfig} MakeCreateOptionsConfig
 * @typedef {import('../dc-types').CredentialMediationRequirement} CredentialMediationRequirement
 */

/**
 * Internal helper to build the request array from validated input.
 * Assumes requestsInputArray is a non-empty array of strings.
 * @private
 * @param {string[]} requestsInputArray - An array of request type strings.
 * @param {CredentialMediationRequirement} mediation - The mediation requirement.
 * @param {Record<string, () => any>} requestMapping - The specific mapping object for the operation type.
 * @returns {{ digital: { requests: any[] }, mediation: CredentialMediationRequirement }} - The final options structure.
 * @throws {Error} If an unknown request type string is encountered within the array.
 */
function _makeOptionsInternal(requestsInputArray, mediation, requestMapping) {
  const requests = [];
  for (const request of requestsInputArray) {
    const factoryFunction = requestMapping[request];
    if (factoryFunction) {
      requests.push(factoryFunction()); // Call the mapped function
    } else {
      // This error means a string *within the array* was unknown
      throw new Error(`Unknown request type within array: ${request}`);
    }
  }
  return { digital: { requests }, mediation };
}

const allMappings = {
  get: {
    "openid4vp-v1-unsigned": () => makeOID4VPDict("openid4vp-v1-unsigned"),
    "openid4vp-v1-signed": () => makeOID4VPDict("openid4vp-v1-signed"),
    "openid4vp-v1-multisigned": () => makeOID4VPDict("openid4vp-v1-multisigned"),
    "default": () => makeDigitalCredentialGetRequest(undefined, undefined),
  },
  create: {
    "openid4vci": () => makeOID4VCIDict(),
    "default": () => makeDigitalCredentialCreateRequest(),
  },
};

/**
 * Internal unified function to handle option creation logic.
 * Routes calls from specific public functions.
 * @private
 * @param {'get' | 'create'} type - The type of operation.
 * @param {string | string[]} protocol - Protocol(s) to use.
 * @param {CredentialMediationRequirement} mediation - Mediation requirement.
 * @returns {{ digital: { requests: any[] }, mediation: CredentialMediationRequirement }}
 * @throws {Error} If type is invalid internally, or input strings are invalid.
 */
function _makeOptionsUnified(type, protocol, mediation) {
  // 1. Get mapping (Type validation primarily happens via caller)
  const mapping = allMappings[type];
   // Added safety check, though public functions should prevent this.
  if (!mapping) {
    throw new Error(`Internal error: Invalid options type specified: ${type}`);
  }

  // 2. Handle single string input
  if (typeof protocol === 'string') {
    if (protocol in mapping) {
      // Valid single string: Pass as array to the core array helper
      return _makeOptionsInternal([protocol], mediation, mapping);
    } else {
      // Invalid single string for this type
      throw new Error(`Unknown request type string '${protocol}' provided for operation type '${type}'`);
    }
  }

  // 3. Handle array input
  if (Array.isArray(protocol)) {
    if (protocol.length === 0) {
      // Handle empty array explicitly
      return { digital: { requests: [] }, mediation };
    }
    // Pass valid non-empty array to the core array helper
    return _makeOptionsInternal(protocol, mediation, mapping);
  }

  // 4. Handle invalid input types (neither string nor array)
  return { digital: { requests: [] }, mediation };
}

/**
 * Creates options for getting credentials.
 * @export
 * @param {MakeGetOptionsConfig} [config={}] - Configuration options
 * @returns {CredentialRequestOptions}
 */
export function makeGetOptions(config = {}) {
  const { protocol = "default", mediation = "required" } = config;
  return _makeOptionsUnified('get', protocol, mediation);
}

/**
 * Creates options for creating credentials.
 * @export
 * @param {MakeCreateOptionsConfig} [config={}] - Configuration options
 * @returns {CredentialCreationOptions}
 */
export function makeCreateOptions(config = {}) {
  const { protocol = "default", mediation = "required" } = config;
  return _makeOptionsUnified('create', protocol, mediation);
}

/**
 *
 * @param {string} protocol
 * @param {object} data
 * @returns {DigitalCredentialGetRequest}
 */
function makeDigitalCredentialGetRequest(protocol = "protocol", data = {}) {
  return {
    protocol,
    data,
  };
}

/**
 * Representation of an OpenID4VP request.
 *
 * @param {string} identifier
 * @returns {DigitalCredentialGetRequest}
 **/
function makeOID4VPDict(identifier = "openid4vp-v1-unsigned") {
  return makeDigitalCredentialGetRequest(identifier, {
    // Canonical example of an OpenID4VP request coming soon.
  });
}

/**
 *
 * @param {string} protocol
 * @param {object} data
 * @returns {DigitalCredentialCreateRequest}
 */
function makeDigitalCredentialCreateRequest(protocol = "protocol", data = {}) {
  return {
    protocol,
    data,
  };
}

/**
 * Representation of an OpenID4VCI request.
 *
 * @returns {DigitalCredentialCreateRequest}
 **/
function makeOID4VCIDict() {
  return makeDigitalCredentialCreateRequest("openid4vci", {
    // Canonical example of an OpenID4VCI request coming soon.
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
    iframe.addEventListener("load", () => resolve(), { once: true });
    iframe.addEventListener("error", (event) => reject(event.error), { once: true });
    if (!iframe.isConnected) {
      document.body.appendChild(iframe);
    }
    iframe.src = url.toString();
  });
}
