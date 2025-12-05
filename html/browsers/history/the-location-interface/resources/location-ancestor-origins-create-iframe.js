const Actions = {
  AddIframe: "addIframe",
  ChangeIframeReferrerPolicy: "mutatePolicy",
  InsertMetaElement: "insertMeta",
}

async function configAndNavigateIFrame(iframe, { src, name, referrerPolicy, options }) {
  iframe.name = name;
  iframe.referrerPolicy = referrerPolicy;
  if (options?.sandbox) {
    // postMessage needs to work
    iframe.setAttribute("sandbox", "allow-scripts");
  }
  document.body.appendChild(iframe);
  await new Promise((resolve) => {
    iframe.addEventListener("load", resolve, { once: true });
    iframe.src = src;
  });
}
