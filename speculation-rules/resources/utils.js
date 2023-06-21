globalThis.assertSpeculationRulesIsSupported = () => {
  assert_implements(
      'supports' in HTMLScriptElement,
      'HTMLScriptElement.supports must be supported');
  assert_implements(
      HTMLScriptElement.supports('speculationrules'),
      '<script type="speculationrules"> must be supported');
};

// If you want access to these, be sure to include
// /html/browsers/browsing-the-web/remote-context-helper/resources/remote-context-helper.js.
// So as to avoid requiring everyone to do that, we only conditionally define this infrastructure.
if (globalThis.RemoteContextHelper) {
  class PreloadingRemoteContextWrapper extends RemoteContextHelper.RemoteContextWrapper {
    async createPreloadedContext(preloadType, { extrasInSpeculationRule = {}, ...extraConfig } = {}) {
      const referrerRemoteContext = this;

      let savedURL;
      const preloadedContext = await this.helper.createContext({
        executorCreator(url) {
          // Save the URL which the remote context helper framework assembled for
          // us, so that we can attach it to the returned `RemoteContextWrapper`.
          savedURL = url;

          return referrerRemoteContext.executeScript((url, preloadType, extrasInSpeculationRule) => {
            const script = document.createElement("script");
            script.type = "speculationrules";
            script.textContent = JSON.stringify({
              [preloadType]: [
                {
                  source: "list",
                  urls: [url],
                  ...extrasInSpeculationRule
                }
              ]
            });
            document.head.append(script);
          }, [url, preloadType, extrasInSpeculationRule]);
        }, extraConfig
      });

      preloadedContext.url = savedURL;
      return preloadedContext;
    }

    async getPreloadingStatusFromHeaders() {
      const requestHeaders = await this.getRequestHeaders();
      const secPurpose = requestHeaders['sec-purpose'];

      assert_equals(requestHeaders.purpose, secPurpose, "Purpose header must equal Sec-Purpose header");

      if (secPurpose === "prefetch") {
        return "prefetched";
      } else if (secPurpose === "prefetch;prerender") {
        return "prerendered";
      } else if (secPurpose === "absent") {
        return "none";
      } else {
        assert_unreached("Unexpected Sec-Purpose header value: " + secPurpose);
      }
    }
  }

  globalThis.PreloadingRemoteContextHelper = class extends RemoteContextHelper {
    static RemoteContextWrapper = PreloadingRemoteContextWrapper;
  };
}
