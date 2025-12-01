export type OpenIDPresentationProtocol =
  | "openid4vp-v1-unsigned"
  | "openid4vp-v1-signed"
  | "openid4vp-v1-multisigned";
export type OpenIDIssuanceProtocol = "openid4vci";
export type GetProtocol = OpenIDPresentationProtocol | "org-iso-mdoc";
export type CreateProtocol = OpenIDIssuanceProtocol;

/**
 * @see https://www.iso.org/obp/ui#iso:std:iso-iec:ts:18013:-7:ed-2:v1:en
 */
export interface MobileDocumentRequest {
  /**
   * Information required for encryption, typically a base64-encoded string or JSON object as a string.
   * The format should comply with the requirements specified in ISO/IEC TS 18013-7.
   */
  readonly encryptionInfo: string;
  /**
   * The device request payload, usually a stringified JSON object containing the request details.
   * This should follow the structure defined in ISO/IEC TS 18013-7 for device requests.
   */
  readonly deviceRequest: string;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialgetrequest-dictionary
 */
export interface DigitalCredentialGetRequest {
  protocol: GetProtocol;
  data: object | MobileDocumentRequest;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialrequestoptions-dictionary
 */
export interface DigitalCredentialRequestOptions {
  /**
   * The list of credential requests.
   */
  requests: DigitalCredentialGetRequest[];
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#extensions-to-credentialrequestoptions-dictionary
 */
export interface CredentialRequestOptions {
  digital: DigitalCredentialRequestOptions;
  mediation?:CredentialMediationRequirement;
  signal?: AbortSignal;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialcreaterequest-dictionary
 */
export interface DigitalCredentialCreateRequest {
  protocol: CreateProtocol;
  data: object;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialcreationoptions-dictionary
 */
export interface DigitalCredentialCreationOptions {
  /**
   * The list of credential requests.
   */
  requests: DigitalCredentialCreateRequest[];
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#extensions-to-credentialcreationoptions-dictionary
 */
export interface CredentialCreationOptions {
  digital: DigitalCredentialCreationOptions;
  mediation?: CredentialMediationRequirement;
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
  userAgentAllowsProtocol(
    protocol: GetProtocol | CreateProtocol | string,
  ): boolean;
}

/**
 * Global DigitalCredential object
 */
declare global {
  const DigitalCredential: DigitalCredential;
}
