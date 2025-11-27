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
 * @typedef {import('../dc-types').DigitalCredential} DigitalCredential
 */

/**
 * Internal helper to build the request array from validated input.
 * Assumes requestsInputArray is a non-empty array of strings.
 * @private
 * @param {string[]} requestsInputArray - An array of request type strings.
 * @param {string} mediation - The mediation requirement.
 * @param {Record<string, Function>} requestMapping - The specific mapping object for the operation type.
 * @param {object} [data={}] - Optional data to include in the request.
 * @returns {{ digital: { requests: any[] }, mediation: string }} - The final options structure.
 * @throws {Error} If an unknown request type string is encountered within the array.
 */
function makeOptionsInternal(requestsInputArray, mediation, requestMapping, data = {}) {
  const requests = [];
  for (const request of requestsInputArray) {
    const factoryFunction = requestMapping[request];
    if (factoryFunction) {
      requests.push(factoryFunction(data));
    } else {
      throw new Error(`Unknown request type within array: ${request}`);
    }
  }
  return { digital: { requests }, mediation: mediation };
}

// Detect supported protocols at module load time
const SUPPORTED_GET_PROTOCOL = ['org-iso-mdoc', 'openid4vp']
  .find(DigitalCredential.userAgentAllowsProtocol);

const SUPPORTED_CREATE_PROTOCOL = ['openid4vci']
  .find(DigitalCredential.userAgentAllowsProtocol);

const allMappings = {
  get: {
    "openid4vp": makeOpenIDPresentationRequest,
    "org-iso-mdoc": makeMdocPresentationRequest,
  },
  create: {
    "openid4vci": makeOpenIDIssuanceRequest,
  },
};

/**
 * Internal unified function to handle option creation logic.
 * Routes calls from specific public functions.
 * @private
 * @param {'get' | 'create'} type - The type of operation.
 * @param {string | string[]} [protocol] - Raw input for protocol types from public function.
 * @param {string} [mediation="required"] - Mediation requirement (default handled by public function).
 * @param {object} [data={}] - Optional data to include in the request.
 * @returns {{ digital: { requests: any[] }, mediation: string }}
 * @throws {Error} If type is invalid internally, or input strings are invalid.
 */
function makeOptionsUnified(type, protocol, mediation = "required", data = {}) {
  const mapping = allMappings[type];

  // Handle case where no protocols are supported by the browser
  if (protocol === undefined) {
    return { digital: { requests: [] }, mediation: mediation };
  }

  if (typeof protocol === 'string') {
    if (protocol in mapping) {
      return makeOptionsInternal([protocol], mediation, mapping, data);
    } else {
      throw new Error(`Unknown protocol '${protocol}' provided for operation type '${type}'`);
    }
  }

  if (Array.isArray(protocol)) {
    if (protocol.length === 0) {
      return { digital: { requests: [] }, mediation: mediation };
    }
    return makeOptionsInternal(protocol, mediation, mapping, data);
  }

  return { digital: { requests: [] }, mediation: mediation };
}

/**
 * Creates options for getting credentials.
 * @export
 * @param {string | string[]} [protocol] - Protocol types ('openid4vp', 'org-iso-mdoc', or an array). Defaults to first supported protocol.
 * @param {string} [mediation="required"] - Credential mediation requirement ("required", "optional", "conditional", "silent").
 * @param {object} [data={}] - Optional data to include in the request.
 * @returns {{ digital: { requests: any[] }, mediation: string }}
 */
export function makeGetOptions(protocol = SUPPORTED_GET_PROTOCOL, mediation = "required", data = {}) {
  return makeOptionsUnified('get', protocol, mediation, data);
}

/**
 * Creates options for creating credentials.
 * @export
 * @param {string | string[]} [protocol] - Protocol types ('openid4vci', or an array). Defaults to first supported protocol.
 * @param {string} [mediation="required"] - Credential mediation requirement ("required", "optional", "conditional", "silent").
 * @returns {{ digital: { requests: any[] }, mediation: string }}
 */
export function makeCreateOptions(protocol = SUPPORTED_CREATE_PROTOCOL, mediation = "required") {
  return makeOptionsUnified('create', protocol, mediation);
}

/**
 * @param {string} protocol
 * @param {object} data
 * @returns {DigitalCredentialGetRequest}
 */
function makeDigitalCredentialGetRequest(protocol, data = {}) {
  if (!protocol) {
    throw new Error('Protocol is required for DigitalCredentialGetRequest');
  }
  return {
    protocol,
    data,
  };
}

/**
 * Creates an OpenID for Verifiable Presentations request.
 *
 * @param {object} [data={}] - Optional data to include in the request.
 * @returns {DigitalCredentialGetRequest}
 **/
function makeOpenIDPresentationRequest(data = {}) {
  return makeDigitalCredentialGetRequest("openid4vp", data);
}

/**
 * Creates a mobile document (mDoc) presentation request following ISO/IEC 18013-7 Annex C.
 *
 * @param {object} [data={}] - Optional data to include in the request.
 * @returns {DigitalCredentialGetRequest}
 **/
function makeMdocPresentationRequest(data = {}) {
  // For mDoc, we need to provide default data if none is specified, but override completely if data is provided
  const defaultData = {
    deviceRequest:
      "omd2ZXJzaW9uYzEuMGtkb2NSZXF1ZXN0c4GhbGl0ZW1zUmVxdWVzdNgYWIKiZ2RvY1R5cGV1b3JnLmlzby4xODAxMy41LjEubURMam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xpWthZ2Vfb3Zlcl8yMfRqZ2l2ZW5fbmFtZfRrZmFtaWx5X25hbWX0cmRyaXZpbmdfcHJpdmlsZWdlc_RocG9ydHJhaXT0",
    encryptionInfo:
      "gmVkY2FwaaJlbm9uY2VYICBetSsDkKlE_G9JSIHwPzr3ctt6Ol9GgmCH8iGdGQNJcnJlY2lwaWVudFB1YmxpY0tleaQBAiABIVggKKm1iPeuOb9bDJeeJEL4QldYlWvY7F_K8eZkmYdS9PwiWCCm9PLEmosiE_ildsE11lqq4kDkjhfQUKPpbX-Hm1ZSLg",
  };

  // If data is empty object, use defaults; otherwise use provided data directly
  const finalData = Object.keys(data).length === 0 ? defaultData : data;
  return makeDigitalCredentialGetRequest("org-iso-mdoc", finalData);
}

/**
 * @param {string} protocol
 * @param {object} data
 * @returns {DigitalCredentialCreateRequest}
 */
function makeDigitalCredentialCreateRequest(protocol, data = {}) {
  if (!protocol) {
    throw new Error('Protocol is required for DigitalCredentialCreateRequest');
  }
  return {
    protocol,
    data,
  };
}

/**
 * Creates an OpenID for Verifiable Credential Issuance request.
 *
 * @returns {DigitalCredentialCreateRequest}
 **/
function makeOpenIDIssuanceRequest() {
  return makeDigitalCredentialCreateRequest("openid4vci", {});
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
