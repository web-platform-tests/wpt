// This creates a serialized <script> element that is useful for blob/data/srcdoc-style tests.

function createScript(sameOrigin, crossOrigin, parent="parent", id="") {
  return `<script>
let i = 0;
const data = { id: "${id}",
               origin: window.origin,
               sameOriginNoCORPSuccess: false,
               crossOriginNoCORPFailure: false };
function report(field, success) {
  i++;
  data[field] = success;
  if (i === 2 || "${sameOrigin}" === "null") {
    window.${parent}.postMessage(data, "*");
  }
}
if ("${sameOrigin}" !== "null") {
  fetch("${sameOrigin}/common/blank.html", { mode: "no-cors" }).then(() => report("sameOriginNoCORPSuccess", true), () => report("sameOriginNoCORPSuccess", false));
}
fetch("${crossOrigin}/common/blank.html", { mode: "no-cors" }).then(() => report("crossOriginNoCORPFailure", false), () => report("crossOriginNoCORPFailure", true));
<\/script>`;
}
