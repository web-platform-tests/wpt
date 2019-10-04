function generateCrossOriginRedirectImage() {
  var target = "http://{{host}}:{{ports[https][0]}}/content-security-policy/support/pass.png";
  var url = "/common/handlers/redirect.py?location=" + encodeURIComponent(target);
  return { url: url, target: target }
}
