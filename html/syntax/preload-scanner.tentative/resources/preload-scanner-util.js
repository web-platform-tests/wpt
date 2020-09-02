function expect_fetched_onload(uuid, expectation, test_markup) {
  return new Promise(resolve => {
    addEventListener('load', resolve);
  }).then(async () => {
    const result = await get_result(uuid);
    if (expectation) {
      assert_not_equals(result, '', 'expected the preload scanner to prefetch');
    } else {
      assert_equals(result, '', 'expected the preload scanner to NOT prefetch');
    }
    return result;
  });
}

function compare_with_nonspeculative(uuid, title) {
  return function(speculative_result) {
    return new Promise(resolve => {
      if (speculative_result === '') {
        resolve(); // Nothing to compare
      }
      const iframe = document.createElement('iframe');
      iframe.onload = resolve;
      iframe.src = `/html/syntax/preload-scanner.tentative/generated/resources/${title}-nonspeculative.sub.html?uuid=${uuid}`;
      document.body.appendChild(iframe);
    }).then(async () => {
      const result = await get_result(uuid);
      if (speculative_result === '') {
        assert_equals(result, speculative_result, 'non-speculative case incorrectly fetched')
      } else {
        assert_not_equals(result, '', 'non-speculative case did not fetch');
      }
      const speculative_headers = speculative_result.split("\r\n");
      const nonspeculative_headers = result.split("\r\n");
      assert_equals(speculative_headers.length, nonspeculative_headers.length, 'expected the same number of headers between speculative and non-speculative')
      for (let i = 0; i < speculative_headers.length; ++i) {
        let [s_header, s_value] = speculative_headers[i].split(': ', 1);
        let [ns_header, ns_value] = nonspeculative_headers[i].split(': ', 1);
        assert_equals(s_header, ns_header, 'expected the order of headers to match between speculative and non-speculative');
        if (s_header === 'Referer' && s_value !== '' && ns_value !== '') {
          s_value = normalize_referrer(s_value);
          ns_value = normalize_referrern(ns_value);
        }
        assert_equals(s_value, ns_value, `expected ${s_header} values to match between speculative and non-speculative`);
      }
    });
  }
}

function normalize_referrer(value) {
  return value.substr(0, value.lastIndexOf('/')) + '(normalized)';
}

async function get_result(uuid) {
    const response = await fetch(`/html/syntax/preload-scanner.tentative/resources/stash.py?action=take&uuid=${uuid}`);
    return await response.text();
}
