async_test(t => {
  const popup = window.open(`data:text/html,<script>alert(1)</script>`);
  // TODO
}, "Navigating a popup to a data: URL");

async_test(t => {
  const dataURL = encodeURIComponent(`data:text/html,<script>alert(1)</script>`);
  const popup = window.open(`resources/redirect.py?location=${dataURL}`);
  // TODO
}, "Navigating a popup to a data: URL via a redirect");
