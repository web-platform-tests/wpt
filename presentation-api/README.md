# Presentation API Tests

This test suite is currently tracking the [Working Draft 13 October 2015][working-draft] of the Presentation API. The Presentation API describes the [conformance criteria for two classes of user agents][conformance-classes] ([controlling user agent][dfn-controlling-user-agent] and [receiving user agent][dfn-receiving-user-agent]). Each of the two subfolders [controlling-ua](./controlling-ua) and [receiving-ua](./receiving-ua) contains the Presentation API tests for each class of user agents.

## IDL Tests

Each of the [controlling-ua](./controlling-ua) and [receiving-ua](./receiving-ua) subfolders contains a file called `idlharness.html` that defines IDL tests of the Presentation API for controlling and receiving user agents. The WebIDL of the Presentation API spec is extracted from the [Working Draft][working-draft] by running the following JavaScript code in the Dev. console of the Browser.

```javascript
(function(){
  var s = "";
  [].forEach.call(document.getElementsByClassName("idl"), function(idl) {
    if (!idl.classList.contains("extract"))
      s += idl.textContent + "\n\n";
  });
  document.body.innerHTML = '<pre></pre>';
  document.body.firstChild.textContent = s;
  })();
```

[working-draft]: http://www.w3.org/TR/2015/WD-presentation-api-20151013/
[conformance-classes]: http://www.w3.org/TR/2015/WD-presentation-api-20151013/#conformance-classes
[dfn-controlling-user-agent]: http://www.w3.org/TR/2015/WD-presentation-api-20151013/#dfn-controlling-user-agent
[dfn-receiving-user-agent]: http://www.w3.org/TR/2015/WD-presentation-api-20151013/#dfn-receiving-user-agent