const Host = {
  SAME_ORIGIN: "same-origin",
  CROSS_ORIGIN: "cross-origin",
};

const PolicyHeader = {
  CSP: "echo-policy.py?policy=",
  EMBEDDING_CSP: "echo-embedding-csp.py",
} 

function generateURL(host, path) {
  var url = new URL("http://{{host}}:{{ports[http][0]}}/content-security-policy/support/");
  url.hostname = host == Host.SAME_ORIGIN ? "{{host}}" : "{{domains[天気の良い日]}}";
  url.pathname += path;

  return url.toString();
}

function generateRedirect(host, target) {
  var url = new URL("http://{{host}}:{{ports[http][0]}}/common/redirect.py?location=" +
   encodeURIComponent(target));
  url.hostname = host == Host.SAME_ORIGIN ? "{{host}}" : "{{domains[天気の良い日]}}";

  return url.toString();
}

function assert_embedding_csp(t, url, csp, expected) {
  var i = document.createElement('iframe');
  if(csp)
    i.csp = csp;
  i.src = url;

  window.addEventListener('message', t.step_func(e => {
    if (e.source != i.contentWindow || !('embedding_csp' in e.data))
        return;
    assert_equals(expected, e.data['embedding_csp']);
    t.done();
  }));

  document.body.appendChild(i);
}
