const HOST_INFO = {
  get HTTP_PORT() {
    return "{{ports[http][0]}}";
  },
  get HTTP_PORT2() {
    return "{{ports[http][1]}}";
  },
  get HTTPS_PORT() {
    return "{{ports[https][0]}}";
  },
  get HTTPS_PORT2() {
    return "{{ports[https][1]}}";
  },
  get PROTOCOL() {
    return self.location.protocol;
  },
  get IS_HTTPS() {
    return this.PROTOCOL === "https:";
  },
  get PORT() {
    return this.IS_HTTPS ? this.HTTPS_PORT : this.HTTP_PORT;
  },
  get PORT2() {
    return this.IS_HTTPS ? this.HTTPS_PORT2 : this.HTTP_PORT2;
  },
  get HTTP_PORT_ELIDED() {
    return this.HTTP_PORT === "80" ? "" : `:${this.HTTP_PORT}`;
  },
  get HTTP_PORT2_ELIDED() {
    return this.HTTP_PORT2 === "80" ? "" : `:${this.HTTP_PORT2}`;
  },
  get HTTPS_PORT_ELIDED() {
    return this.HTTPS_PORT === "443" ? "" : `:${this.HTTPS_PORT}`;
  },
  get PORT_ELIDED() {
    return this.IS_HTTPS ? this.HTTPS_PORT_ELIDED : this.HTTP_PORT_ELIDED;
  },
  get ORIGINAL_HOST() {
    return "{{host}}";
  },
  get REMOTE_HOST() {
    return this.ORIGINAL_HOST === "localhost"
      ? "127.0.0.1"
      : `www1.${this.ORIGINAL_HOST}`;
  },
  get OTHER_HOST() {
    return "{{domains[www2]}}";
  },
  get NOTSAMESITE_HOST() {
    return this.ORIGINAL_HOST === "localhost"
      ? "127.0.0.1"
      : "{{hosts[alt][]}}";
  },
  get ORIGIN() {
    return `${this.PROTOCOL}//${this.ORIGINAL_HOST}${this.PORT_ELIDED}`;
  },
  get HTTP_ORIGIN() {
    return `http://${this.ORIGINAL_HOST}${this.HTTP_PORT_ELIDED}`;
  },
  get HTTPS_ORIGIN() {
    return `https://${this.ORIGINAL_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  get HTTPS_ORIGIN_WITH_CREDS() {
    return `https://foo:bar@${this.ORIGINAL_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  get HTTP_ORIGIN_WITH_DIFFERENT_PORT() {
    return `http://${this.ORIGINAL_HOST}${this.HTTP_PORT2_ELIDED}`;
  },
  get REMOTE_ORIGIN() {
    return `${this.PROTOCOL}//${this.REMOTE_HOST}${this.PORT_ELIDED}`;
  },
  get OTHER_ORIGIN() {
    return `${this.PROTOCOL}//${this.OTHER_HOST}${this.PORT_ELIDED}`;
  },
  get HTTP_REMOTE_ORIGIN() {
    return `http://${this.REMOTE_HOST}${this.HTTP_PORT_ELIDED}`;
  },
  get HTTP_NOTSAMESITE_ORIGIN() {
    return `http://${this.NOTSAMESITE_HOST}${this.HTTP_PORT_ELIDED}`;
  },
  get HTTP_REMOTE_ORIGIN_WITH_DIFFERENT_PORT() {
    return `http://${this.REMOTE_HOST}${this.HTTP_PORT2_ELIDED}`;
  },
  get HTTPS_REMOTE_ORIGIN() {
    return `https://${this.REMOTE_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  get HTTPS_REMOTE_ORIGIN_WITH_CREDS() {
    return `https://foo:bar@${this.REMOTE_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  get HTTPS_NOTSAMESITE_ORIGIN() {
    return `https://${this.NOTSAMESITE_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  get UNAUTHENTICATED_ORIGIN() {
    return `http://${this.OTHER_HOST}${this.HTTP_PORT_ELIDED}`;
  },
  get AUTHENTICATED_ORIGIN() {
    return `https://${this.OTHER_HOST}${this.HTTPS_PORT_ELIDED}`;
  },
  getPort(loc) {
    return loc.port || (loc.protocol === "https:" ? "443" : "80");
  },
};

/**
 * Host information for cross-origin tests.
 * @returns {Object} with properties for different host information.
 */
function get_host_info() {
  return { ...HOST_INFO };
}

/**
 * When a default port is used, location.port returns the empty string.
 * This function attempts to provide an exact port, assuming we are running under wptserve.
 * @param {*} loc - can be Location/<a>/<area>/URL, but assumes http/https only.
 * @returns {string} The port number.
 */
function get_port(loc) {
  return HOST_INFO.getPort(loc);
}
