function describeNode(node) {
  if (node === null) {
    return "null";
  }
  switch (node.nodeType) {
    case Node.TEXT_NODE:
      return JSON.stringify(node.data);
    case Node.PROCESSING_INSTRUCTION_NODE:
      return `<?${node.target}>`;
    case Node.ELEMENT_NODE:
      return `<${node.localName}>`;
  }
  return node.nodeName;
}

function describeRecord(record) {
  assert_equals(record.type, "childList", "record.type");
  assert_equals(record.attributeName, null, "record.attributeName");
  assert_equals(record.attributeNamespace, null, "record.attributeNamespace");
  assert_equals(record.oldValue, null, "record.oldValue");
  const added = Array.from(record.addedNodes, describeNode).join(", ");
  const removed = Array.from(record.removedNodes, describeNode).join(", ");
  return `${record.activeTemplateStatus}: added [${added}] removed [${removed}] ` +
    `between ${describeNode(record.previousSibling)} and ${describeNode(record.nextSibling)}`;
}

// Returns a function that returns all the records the observer got so far,
// whether they were delivered to the callback or are still queued.
function collectRecords(target, options) {
  const records = [];
  const observer = new MutationObserver(list => records.push(...list));
  observer.observe(target, options);
  return () => {
    records.push(...observer.takeRecords());
    return records;
  };
}
