// Reports how get(), create() and store() settle for an origin-bound credential
// type, so an opaque-origin frame can report its result to the top-level test.
//
// PasswordCredential is origin bound, so from an opaque origin all three are
// expected to reject with SecurityError. Each operation is reported separately,
// along with whether the machinery it needs is even present, so a browser that
// does not implement PasswordCredential reports "unsupported" rather than a
// result that could be mistaken for conformance.
(async () => {
  const id = new URL(location.href).searchParams.get("id");
  const report = {
    id,
    origin: String(self.origin),
    secure: self.isSecureContext,
    supported: false,
    get: "unsupported",
    create: "unsupported",
    store: "unsupported",
  };

  const post = () => (window.top || window.parent).postMessage(report, "*");

  const settle = async (operation) => {
    try {
      await operation();
      return "resolved";
    } catch (error) {
      return error.name;
    }
  };

  try {
    if (!self.PasswordCredential || !navigator.credentials) {
      post();
      return;
    }
    report.supported = true;

    const data = { id: "id", password: "pencil" };

    report.get = await settle(() =>
      navigator.credentials.get({ password: true })
    );

    report.create = await settle(() =>
      navigator.credentials.create({ password: data })
    );

    // Construct outside settle() so a constructor failure is never reported as
    // a store() result.
    let credential;
    try {
      credential = new PasswordCredential(data);
    } catch (error) {
      report.store = "construction-failed:" + error.name;
      post();
      return;
    }
    report.store = await settle(() => navigator.credentials.store(credential));
  } catch (error) {
    report.get = report.create = report.store = "harness-error:" + error.name;
  }

  post();
})();
