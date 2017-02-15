function get_host_info() {
  const HTTP_PORT = '{{ports[http][0]}}';
  const HTTPS_PORT = '{{ports[https][0]}}';
  const ORIGINAL_HOST = '{{host}}';
  const REMOTE_HOST = '{{domains[www1]}}';
  const OTHER_HOST = '{{domains[www2]}}';
  return {
    HTTP_ORIGIN: 'http://' + ORIGINAL_HOST + ':' + HTTP_PORT,
    HTTPS_ORIGIN: 'https://' + ORIGINAL_HOST + ':' + HTTPS_PORT,
    HTTPS_ORIGIN_WITH_CREDS: 'https://foo:bar@' + ORIGINAL_HOST + ':' + HTTPS_PORT,
    HTTP_REMOTE_ORIGIN: 'http://' + REMOTE_HOST + ':' + HTTP_PORT,
    HTTPS_REMOTE_ORIGIN: 'https://' + REMOTE_HOST + ':' + HTTPS_PORT,
    HTTPS_REMOTE_ORIGIN_WITH_CREDS: 'https://foo:bar@' + REMOTE_HOST + ':' + HTTPS_PORT,
    UNAUTHENTICATED_ORIGIN: 'http://' + OTHER_HOST + ':' + HTTP_PORT,
    AUTHENTICATED_ORIGIN: 'https://' + OTHER_HOST + ':' + HTTPS_PORT
  };
}
