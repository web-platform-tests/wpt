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
 * @typedef {import('../dc-types').MobileDocumentRequest} MobileDocumentRequest
 * @typedef {import('../dc-types').OpenIDPresentationProtocol} OpenIDPresentationProtocol
 * @typedef {import('../dc-types').OpenIDIssuanceProtocol} OpenIDIssuanceProtocol
 * @typedef {GetProtocol | CreateProtocol} Protocol
 */

/**
 * @typedef {{ digital: { requests: any[] }, mediation?: CredentialMediationRequirement, signal?: AbortSignal }} InternalOptions
 */

/**
 * @typedef {import('../dc-types').DigitalCredentialGetRequest} Request
 */

/** @type {GetProtocol[]} */
const GET_PROTOCOLS = /** @type {const} */ ([
  "openid4vp-v1-unsigned",
  "openid4vp-v1-signed",
  "openid4vp-v1-multisigned",
  "org-iso-mdoc",
]);

/** @type {CreateProtocol[]} */
const CREATE_PROTOCOLS = /** @type {const} */ (["openid4vci"]);

const SUPPORTED_GET_PROTOCOL = GET_PROTOCOLS.find(
  (protocol) => DigitalCredential.userAgentAllowsProtocol(protocol)
);
const SUPPORTED_CREATE_PROTOCOL = CREATE_PROTOCOLS.find(
  (protocol) => DigitalCredential.userAgentAllowsProtocol(protocol)
);

/** @type {Record<Protocol, object | MobileDocumentRequest>} */
const CANONICAL_REQUEST_OBJECTS = {
  "openid4vci": {
    /* Canonical object coming soon */
  },
  "openid4vp-v1-unsigned": {
    /* Canonical object coming soon */
  },
  "openid4vp-v1-signed": {
    /* Canonical object coming soon */
  },
  "openid4vp-v1-multisigned": {
    /* Canonical object coming soon */
  },
  /** @type MobileDocumentRequest **/
  "org-iso-mdoc": {
    deviceRequest:
      "omd2ZXJzaW9uYzEuMGtkb2NSZXF1ZXN0c4GhbGl0ZW1zUmVxdWVzdNgYWIKiZ2RvY1R5cGV1b3JnLmlzby4xODAxMy41LjEubURMam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4x9pWthZ2Vfb3Zlcl8yMfRqZ2l2ZW5fbmFtZfRrZmFtaWx5X25hbWX0cmRyaXZpbmdfcHJpdmlsZWdlc_RocG9ydHJhaXT0",
    encryptionInfo:
      "gmVkY2FwaaJlbm9uY2VYICBetSsDkKlE_G9JSIHwPzr3ctt6Ol9GgmCH8iGdGQNJcnJlY2lwaWVudFB1YmxpY0tleaQBAiABIVggKKm1iPeuOb9bDJeeJEL4QldYlWvY7F_K8eZkmYdS9PwiWCCm9PLEmosiE_ildsE11lqq4kDkjhfQUKPpbX-Hm1ZSLg",
  },
};

/**
 * Internal helper to build the request array from validated input.
 * Assumes protocols is a non-empty array of Protocols.
 *
 * @param {Protocol[]} protocols
 * @param {Record<string, (data?: object) => Request>} requestMapping
 * @param {object} [data={}]
 * @param {CredentialMediationRequirement} [mediation]
 * @param {AbortSignal} [signal]
 *
 * @returns {InternalOptions}
 */
function makeOptionsInternal(protocols, requestMapping, data, mediation, signal) {
  const requests = buildRequests(protocols, requestMapping, data);

  /** @type {InternalOptions} */
  const result = { digital: { requests } };

  if (mediation !== undefined) {
    result.mediation = mediation;
  }

  if (signal !== undefined) {
    result.signal = signal;
  }

  return result;
}

/**
 * Small helper to build a list of request objects from a protocol list
 * and a mapping table.
 *
 * @template Req
 * @param {Protocol[]} protocols
 * @param {Record<string, (data?: object) => Req>} mapping
 * @param {object} [data]
 * @returns {Req[]}
 * @throws {Error} If an unknown protocol string is encountered.
 */
function buildRequests(protocols, mapping, data) {
  /** @type {Req[]} */
  const requests = [];
  for (const protocol of protocols) {
    if (protocol in mapping) {
      const factoryFunction = mapping[protocol];
      requests.push(factoryFunction(data));
    } else {
      throw new Error(`Unknown request type within array: ${protocol}`);
    }
  }
  return requests;
}

/** @type {{
 *   get: Record<GetProtocol, (data?: object) => DigitalCredentialGetRequest>;
 *   create: Record<CreateProtocol, (data?: object) => DigitalCredentialCreateRequest>;
 * }} */
const allMappings = {
  get: {
    "org-iso-mdoc": (data = { ...CANONICAL_REQUEST_OBJECTS["org-iso-mdoc"] }) => {
      return { protocol: "org-iso-mdoc", data };
    },
    "openid4vp-v1-unsigned": (
      data = { ...CANONICAL_REQUEST_OBJECTS["openid4vp-v1-unsigned"] },
    ) => {
      return { protocol: "openid4vp-v1-unsigned", data };
    },
    "openid4vp-v1-signed": (
      data = { ...CANONICAL_REQUEST_OBJECTS["openid4vp-v1-signed"] },
    ) => {
      return { protocol: "openid4vp-v1-signed", data };
    },
    "openid4vp-v1-multisigned": (
      data = { ...CANONICAL_REQUEST_OBJECTS["openid4vp-v1-multisigned"] },
    ) => {
      return { protocol: "openid4vp-v1-multisigned", data };
    },
  },
  create: {
    openid4vci: (data = { ...CANONICAL_REQUEST_OBJECTS["openid4vci"] }) => {
      return { protocol: "openid4vci", data };
    },
  },
};

/**
 * Internal unified function to handle option creation logic.
 * Routes calls from specific public functions.
 *
 * @param {"get" | "create"} type
 * @param {Protocol | Protocol[]} protocol
 * @param {CredentialMediationRequirement} [mediation]
 * @param {object} [data={}]
 * @param {AbortSignal} [signal]
 * @returns {InternalOptions}
 */
function makeOptionsUnified(type, protocol, mediation, data, signal) {
  const mapping = allMappings[type];

  if (typeof protocol === "string") {
    if (protocol in mapping) {
      return makeOptionsInternal([protocol], mapping, data, mediation, signal);
    }
    throw new Error(
      `Unknown protocol "${protocol}"" provided for operation type "${type}"`,
    );
  }

  if (Array.isArray(protocol)) {
    if (protocol.length === 0) {
      /** @type {InternalOptions} */
      const emptyResult = { digital: { requests: [] } };
      if (mediation !== undefined) {
        emptyResult.mediation = mediation;
      }
      if (signal !== undefined) {
        emptyResult.signal = signal;
      }
      return emptyResult;
    }
    return makeOptionsInternal(protocol, mapping, data, mediation, signal);
  }

  /** @type {InternalOptions} */
  const fallbackResult = { digital: { requests: [] } };
  if (mediation !== undefined) {
    fallbackResult.mediation = mediation;
  }
  if (signal !== undefined) {
    fallbackResult.signal = signal;
  }
  return fallbackResult;
}

/**
 * Creates options for getting credentials.
 * @export
 * @param {MakeGetOptionsConfig} [config={}] - Configuration options
 * @returns {CredentialRequestOptions}
 */
export function makeGetOptions(config = {}) {
  const { protocol = SUPPORTED_GET_PROTOCOL, mediation, data, signal } = config;
  if (!protocol) {
    throw new Error("No Protocol. Can't make get options.");
  }
  return /** @type {CredentialRequestOptions} */ (
    makeOptionsUnified("get", protocol, mediation, data, signal)
  );
}

/**
 * Creates options for creating credentials.
 * @export
 * @param {MakeCreateOptionsConfig} [config={}] - Configuration options
 * @returns {CredentialCreationOptions}
 */
export function makeCreateOptions(config = {}) {
  const { protocol = SUPPORTED_CREATE_PROTOCOL, mediation, data, signal } = config;
  if (!protocol) {
    throw new Error("No protocol. Can't make create options.");
  }
  return /** @type {CredentialCreationOptions} */ (
    makeOptionsUnified("create", protocol, mediation, data, signal)
  );
}

/**
 * Sends a message to an iframe and return the response.
 *
 * @param {HTMLIFrameElement} iframe - The iframe element to send the message to.
 * @param {import("../dc-types").SendMessageData} data - The data to be sent to the iframe.
 * @returns {Promise<any>} - A promise that resolves with the response from the iframe.
 */
export function sendMessage(iframe, data) {
  return new Promise((resolve, reject) => {
    if (!iframe.contentWindow) {
      reject(
        new Error(
          "iframe.contentWindow is undefined, cannot send message (something is wrong with the test that called this).",
        ),
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
    iframe.addEventListener("error", (event) => reject(event.error), {
      once: true,
    });
    if (!iframe.isConnected) {
      document.body.appendChild(iframe);
    }
    iframe.src = url.toString();
  });
}
