// Fetch test results from the Stash
async function get_results(uuid) {
  const response = await fetch(`/html/syntax/speculative-parsing/expect-no-linked-resources/stash.py?action=get&uuid=${uuid}`);
  const text = await response.text();
  return text;
}