// Regression test for https://crbug.com/1369564
promise_test(async test => {
  const message = new Promise(r => window.addEventListener("message", r));

  const iframe_1 = document.createElement("iframe");
  const iframe_2 = document.createElement("iframe");
  document.body.appendChild(iframe_1);
  document.body.appendChild(iframe_2);

  iframe_2.srcdoc = `
    <script>
      window.parent.postMessage("DONE", "*");

      // https://crbug.com/1369564. Calling this unrelated instruction seems to
      // prevent the parent from receiving the message we just sent.
      parent.frames[0].document.write("");
    </scr`+`ipt>
  `;
  assert_equals((await message).data, "DONE");
})
