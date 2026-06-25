export type OpenIDPresentationProtocol =
  | "openid4vp-v1-unsigned"
  | "openid4vp-v1-signed"
  | "openid4vp-v1-multisigned";
export type OpenIDIssuanceProtocol = "openid4vci-v1";
export type GetProtocol = OpenIDPresentationProtocol | "org-iso-mdoc";
export type IssueProtocol = OpenIDIssuanceProtocol;

export type CredentialMediationRequirement =
  | "conditional"
  | "optional"
  | "required"
  | "silent";

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
 * Configuration for makeGetOptions function
 */
export interface MakeGetOptionsConfig {
  /**
   * Protocol(s) to use for the request.
   * Can be a single protocol, array of protocols, or empty array.
   * If not provided, uses the default supported protocol.
   */
  protocol?: GetProtocol | GetProtocol[];
  /**
   * Explicit credential requests.
   * When provided, these are used in addition to any protocol-based requests.
   */
  requests?: DigitalCredentialGetRequest[];
  /**
   * Optional data to override canonical data for protocol-based requests.
   */
  data?: MobileDocumentRequest | object;
  /**
   * Credential mediation requirement
   */
  mediation?: CredentialMediationRequirement;
  /**
   * Optional AbortSignal for request cancellation
   */
  signal?: AbortSignal;
}

/**
 * Configuration for makeIssueOptions function
 */
export interface MakeIssueOptionsConfig {
  /**
   * Protocol(s) to use for the request.
   * Can be a single protocol, array of protocols, or empty array.
   * If not provided, uses the default supported protocol.
   */
  protocol?: IssueProtocol | IssueProtocol[];
  /**
   * Explicit credential requests.
   * When provided, these are used in addition to any protocol-based requests.
   */
  requests?: DigitalCredentialIssuanceRequest[];
  /**
   * Optional data to override canonical data for protocol-based requests.
   */
  data?: object;
  /**
   * Optional AbortSignal for request cancellation
   */
  signal?: AbortSignal;
}

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
  mediation?: CredentialMediationRequirement;
  signal?: AbortSignal;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialissuancerequest-dictionary
 */
export interface DigitalCredentialIssuanceRequest {
  protocol: string;
  data: object;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#the-digitalcredentialissuanceoptions-dictionary
 */
export interface DigitalCredentialIssuanceOptions {
  /**
   * The list of credential requests.
   */
  requests: DigitalCredentialIssuanceRequest[] | any;
  /**
   * Optional AbortSignal for request cancellation
   */
  signal?: AbortSignal;
}

/**
 * @see https://w3c-fedid.github.io/digital-credentials/#dom-digitalcredentialissuanceresponse
 */
export interface DigitalCredentialIssuanceResponse {
  protocol: string;
  data: object;
}

/**
 * The actions that can be performed on the API via the iframe.
 */
export type IframeActionType =
  | "issue"
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
  options?: CredentialRequestOptions | DigitalCredentialIssuanceOptions;
}

/**
 * The DigitalCredential interface
 */
export interface DigitalCredentialStatic {
  /**
   * Check if the user agent allows a specific protocol
   */
  userAgentAllowsProtocol(protocol: string): boolean;
  /**
   * Request issuance of a digital credential
   */
  issue(
    options: DigitalCredentialIssuanceOptions,
  ): Promise<DigitalCredentialIssuanceResponse>;
}

declare global {
  var DigitalCredential: DigitalCredentialStatic;
}
