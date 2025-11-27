export type GetProtocol = "default" | "openid4vp" | "org-iso-mdoc";
export type CreateProtocol = "default" | "openid4vci";

export type CredentialMediationRequirement =
  | "conditional"
  | "optional"
  | "required"
  | "silent";

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialgetrequest-dictionary
 */
export interface DigitalCredentialGetRequest {
  protocol: string;
  data: object;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialrequestoptions-dictionary
 */
export interface DigitalCredentialRequestOptions {
  /**
   * The list of credential requests.
   */
  requests: DigitalCredentialGetRequest[] | any;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#extensions-to-credentialrequestoptions-dictionary
 */
export interface CredentialRequestOptions {
  digital: DigitalCredentialRequestOptions;
  mediation: CredentialMediationRequirement;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialcreaterequest-dictionary
 */
export interface DigitalCredentialCreateRequest {
  protocol: string;
  data: object;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialcreationoptions-dictionary
 */
export interface DigitalCredentialCreationOptions {
  /**
   * The list of credential requests.
   */
  requests: DigitalCredentialCreateRequest[] | any;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#extensions-to-credentialcreationoptions-dictionary
 */
export interface CredentialCreationOptions {
  digital: DigitalCredentialCreationOptions;
  mediation: CredentialMediationRequirement;
}

/**
 * The actions that can be performed on the API via the iframe.
 */
export type IframeActionType =
  | "create"
  | "get"
  | "ping"
  | "preventSilentAccess";

/**
 * If present, when the abort controller should be aborted
 * relative the invocation of the API.
 */
export type AbortType = "before" | "after";

export interface EventData {
  /**
   * Action to perform on the API.
   */
  action: IframeActionType;
  /**
   * If the action should be aborted, and when.
   */
  abort?: AbortType;
  /**
   * The options to pass to the API.
   */
  options?: object;
  /**
   * If the API needs to blessed before the action is performed.
   */
  needsUserActivation?: boolean;
}

export interface SendMessageData {
  action: IframeActionType;
  options?: CredentialRequestOptions;
}

/**
 * The DigitalCredential interface - W3C Standard
 * @see https://w3c-fedid.github.io/digital-credentials/#dom-digitalcredential
 */
export interface DigitalCredential {
  /**
   * Checks if the user agent allows a specific protocol.
   * @see https://w3c-fedid.github.io/digital-credentials/#dom-digitalcredential-useragentallowsprotocol
   * @param protocol - The protocol to check
   * @returns true if the protocol is allowed, false otherwise
   */
  userAgentAllowsProtocol(protocol: string): boolean;
}

/**
 * Global DigitalCredential object
 */
declare global {
  const DigitalCredential: DigitalCredential;
}
