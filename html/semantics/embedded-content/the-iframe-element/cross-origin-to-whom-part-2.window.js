async_test(t => {
  const frame = document.body.appendChild(document.createElement("iframe"));
  frame.src = "support/document-with-embedded-svg.html";
  const elements = {
    "embed": ["getSVGDocument"],
    "frame": ["contentDocument"],
    "iframe": ["getSVGDocument", "contentDocument"],
    "object": ["getSVGDocument", "contentDocument"]
  };
  function element_to_document(element) {
     const api = elements[element.localName][0];
     if (api == "getSVGDocument") {
        return element[api]();
     }
     return element[api];
  }
  function assert_apis(instance, assertNull = false) {
    const name = instance.localName;
    let priorPossibleDocument = null;
    elements[name].forEach(api => {
      const assertReason = `${name}[${api}]`;
      let possibleDocument = null;
      if (api == "getSVGDocument") {
        possibleDocument = instance[api]();
      } else {
        possibleDocument = instance[api];
      }
      if (assertNull) {
        assert_equals(possibleDocument, null, assertReason);
        return;
      } else {
        assert_not_equals(possibleDocument, null, assertReason);

        // This needs standardizing still
        // assert_class_string(possibleDocument, "XMLDocument");
      }

      // Ensure getSVGDocument() and contentDocument if both available return the same
      if (priorPossibleDocument === null) {
        priorPossibleDocument = possibleDocument;
      } else {
        assert_equals(priorPossibleDocument, possibleDocument);
      }
    });
  }
  frame.onload = t.step_func_done(() => {
    const instances = Object.keys(elements).map(element => frame.contentDocument.querySelector(element));
    instances.forEach(instance => assert_apis(instance));
    instances.forEach(instance => {
      const svgDocument = element_to_document(instance);
      svgDocument.domain = svgDocument.domain;
    });
    document.domain = document.domain;
    assert_equals(frame.contentDocument, null);
    instances.forEach(instance => assert_apis(instance, true));
  });
  document.body.appendChild(frame);
}, "Test embed/frame/iframe/object nested document APIs for same origin-domain and cross origin-domain embedder document");
