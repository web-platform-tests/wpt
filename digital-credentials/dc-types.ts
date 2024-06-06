export type ProviderType = "default" | "openid4vp";

/**
 * @see https://wicg.github.io/digital-credentials/#dom-identityrequestprovider
 */
export interface IdentityRequestProvider {
  protocol: string;
  request: object;
}

/**
 * @see https://wicg.github.io/digital-credentials/#dom-digitalcredentialrequestoptions
 */
export interface DigitalCredentialRequestOptions {
  /**
   * The list of identity request providers
   */
  providers: IdentityRequestProvider[] | any;
}

/**
 * @see https://wicg.github.io/digital-credentials/#extensions-to-credentialrequestoptions-dictionary
 */
export interface CredentialRequestOptions {
  /**
   * The digital credential request options.
   */
  digital: DigitalCredentialRequestOptions;
}

/**
 * The actions that can be performed on the API via the iframe.
 */
export type IframeActionType = "create" | "get" | "preventSilentAccess";

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
}



export interface SendMessageData {
  action: IframeActionType;
  options?: CredentialRequestOptions;
}

/**
 * @param {HTMLIFrameElement} iframe - The iframe element to send the message to.
 * @param {SendMessageData} data - The data to be sent to the iframe.
 * @returns {Promise<any>} - A promise that resolves with the response from the iframe.
 */
export type SendMessage = (iframe: HTMLIFrameElement, data: SendMessageData) => Promise<any>;

