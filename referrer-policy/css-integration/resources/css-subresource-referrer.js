// A helper for tests that check the `Referer` header sent for subresource
// requests from CSS: images, fonts, SVG resources, and `@import`.
//
// A test declares the scenario, and the helper builds the style sheet, waits
// for the subresource request, and checks the `Referer` header recorded by
// `/common/security-features/subresource/*.py`:
//
//   testCssSubresourceReferrer({
//     // Where the CSS is: 'external' (a `<link rel="stylesheet">`), 'inline'
//     // (a `<style>` element), or 'style-attribute'.
//     stylesheet: 'external',
//     // For 'external': the value of the `Referrer-Policy` header of the
//     // style sheet. Omit it to serve the style sheet without the header.
//     stylesheet_referrer_policy: 'no-referrer',
//     // 'image', 'font', 'svg', or 'import'.
//     subresource: 'image',
//     // For 'svg': the property that references the SVG resource.
//     svg_property: 'filter',
//     // Whether the subresource is 'same-origin' or 'cross-origin' with the
//     // referrer (the style sheet URL for 'external', and the document URL
//     // otherwise).
//     target: 'cross-origin',
//     // Request URL modifiers in the `url()`, if any.
//     modifiers: 'referrer-policy(unsafe-url)',
//     // The expected `Referer` header: 'no referrer', 'the origin', or
//     // 'the full URL' (of the referrer).
//     expected: 'the origin',
//   });
//
// The document's referrer policy is given by the `document-policy` query
// parameter (e.g. `<meta name="variant"
// content="?document-policy=no-referrer">`), and this script sets it by
// inserting a `<meta name="referrer">` when it is loaded. Without the
// parameter, the document has the default referrer policy.
//
// 'external' style sheets are served by `stylesheet.py` in this directory, and
// their subresources are loaded from the document's origin. For
// 'cross-origin', the style sheet is loaded from another origin. This keeps
// the subresource requests same-origin with the document, which SVG resource
// requests without `cross-origin()` require.
//
// Depends on `/common/utils.js`, `/common/get-host-info.sub.js`, and
// `/common/security-features/resources/common.sub.js`.

// Returns the document's referrer policy given by the `document-policy` query
// parameter, or `null` if it is not given.
function documentReferrerPolicy() {
  return new URLSearchParams(location.search).get('document-policy');
}

{
  const policy = documentReferrerPolicy();
  if (policy !== null) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = policy;
    document.head.appendChild(meta);
  }
}

// Returns a description of `referrer` relative to `referrer_source` that does
// not contain random tokens, so that failure messages are stable across runs.
function describeReferrer(referrer, referrer_source, stylesheet) {
  if (referrer === undefined) {
    return 'no referrer';
  }
  if (referrer === referrer_source) {
    return 'the full URL';
  }
  if (referrer === new URL(referrer_source).origin + '/') {
    return 'the origin';
  }
  if (stylesheet === 'external') {
    const document_url = location.href.split('#')[0];
    if (referrer === document_url) {
      return 'the document URL (instead of the style sheet URL)';
    }
    if (referrer === location.origin + '/') {
      return 'the document origin (instead of the style sheet origin)';
    }
  }
  return 'an unexpected referrer: ' + referrer;
}

function loadStyleSheet(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = () => reject(new Error('Failed to load the style sheet'));
    document.head.appendChild(link);
  });
}

function testCssSubresourceReferrer({
  stylesheet,
  stylesheet_referrer_policy,
  subresource,
  svg_property = 'filter',
  target,
  modifiers = '',
  expected,
}) {
  const stylesheet_description = {
    'external': stylesheet_referrer_policy === undefined ?
        'an external style sheet without a Referrer-Policy header' :
        `an external style sheet with Referrer-Policy: ${
            stylesheet_referrer_policy}`,
    'inline': 'a <style> element',
    'style-attribute': 'a style attribute',
  }[stylesheet];
  const description = [
    `${target} ${subresource === 'svg' ? `SVG ${svg_property}` : subresource}`,
    `in ${stylesheet_description}`,
    modifiers ? `with ${modifiers}` : 'without modifiers',
    `in a document with ${documentReferrerPolicy() ?? 'the default'}`,
    `referrer policy sends ${expected}`,
  ].join(' ');

  promise_test(async t => {
    // Wait for `document.body`.
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, {once: true});
      });
    }
    const id = token();
    const host_info = get_host_info();
    let stylesheet_origin;
    let subresource_origin;
    if (stylesheet === 'external') {
      stylesheet_origin = target === 'cross-origin' ?
          host_info.HTTP_REMOTE_ORIGIN :
          location.origin;
      subresource_origin = location.origin;
    } else {
      subresource_origin = target === 'cross-origin' ?
          host_info.HTTP_ORIGIN_WITH_DIFFERENT_PORT :
          location.origin;
    }

    const handler = {
      'image': 'image.py',
      'font': 'font.py',
      'svg': 'svg.py',
      'import': 'stylesheet.py',
    }[subresource];
    const subresource_url = new URL(
        `/common/security-features/subresource/${handler}`, subresource_origin);
    subresource_url.searchParams.set('id', id);
    if (subresource === 'import') {
      subresource_url.searchParams.set('type', 'stylesheet-only');
    }
    const url = `url("${subresource_url.href}${
        subresource === 'svg' ? '#target' : ''}" ${modifiers})`;

    // The element that uses the subresource.
    let element;
    if (subresource === 'svg') {
      const svg_ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svg_ns, 'svg');
      element = document.createElementNS(svg_ns, 'path');
      element.setAttribute('d', 'M 50,5 95,100 5,100 z');
      svg.appendChild(element);
      document.body.appendChild(svg);
    } else if (subresource !== 'import') {
      element = document.createElement('div');
      element.textContent = 'X';
      document.body.appendChild(element);
    }
    const target_class = `target-${id}`;
    element?.classList.add(target_class);

    const declarations = {
      'image': `width: 100px; height: 100px; background-image: ${url};`,
      'font': `font-family: "font-${id}";`,
      'svg': `${svg_property}: ${url};`,
    }[subresource];
    let css = '';
    if (subresource === 'import') {
      css = `@import ${url};`;
    } else {
      if (subresource === 'font') {
        css = `@font-face { font-family: "font-${id}"; src: ${url}; } `;
      }
      css += `.${target_class} { ${declarations} }`;
    }

    let referrer_source = location.href.split('#')[0];
    if (stylesheet === 'external') {
      const css_url =
          new URL('/referrer-policy/css-integration/resources/stylesheet.py',
                  stylesheet_origin);
      css_url.searchParams.set('css', css);
      if (stylesheet_referrer_policy !== undefined) {
        css_url.searchParams.set('referrer-policy', stylesheet_referrer_policy);
      }
      referrer_source = css_url.href;
      await loadStyleSheet(css_url.href);
    } else if (stylesheet === 'inline') {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    } else {
      assert_true(
          ['image', 'svg'].includes(subresource),
          'Only images and SVG resources are tested in a style attribute');
      element.setAttribute('style', declarations);
    }

    // There is no way to wait for a resource referenced from CSS to be loaded,
    // so wait for a while (as in /referrer-policy/css-integration/).
    await timeoutPromise(t, 1000);
    const server_data =
        await xhrRequest(`${subresource_url.href}&report-headers`);
    assert_not_equals(server_data, null,
                      'Subresource request was not received by the server');
    assert_own_property(server_data, 'headers');
    assert_equals(describeReferrer(server_data.headers.referer, referrer_source,
                                   stylesheet),
                  expected);
  }, description);
}
