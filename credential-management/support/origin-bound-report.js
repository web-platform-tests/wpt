// Reports how get(), create() and store() settle for an origin-bound credential
// type, so an opaque-origin frame can report back to the top-level test.
//
// PasswordCredential is origin bound, so all three are expected to reject with
// SecurityError from an opaque origin. A non-opaque frame must not see that error.
(async () => {
  const id = new URL(location.href).searchParams.get("id");
  const report = {
    id,
    origin: String(self.origin),
    secure: self.isSecureContext,
    get: "resolved",
    create: "resolved",
    store: "resolved",
  };

  const settle = async (operation) => {
    try {
      await operation();
      return "resolved";
    } catch (error) {
      return error.name;
    }
  };

  if (!(navigator.credentials && navigator.credentials.get)) {
    report.get = report.create = report.store = "unavailable";
    (window.top || window.parent).postMessage(report, "*");
    return;
  }

  report.get = await settle(() => navigator.credentials.get({ password: true }));

  const data = { id: "id", password: "pencil" };
  report.create = await settle(() =>
    navigator.credentials.create({ password: data })
  );

  // store() needs a credential object. Constructing one is independent of the
  // opaque-origin check, so fall back to reporting the construction failure
  // rather than a misleading store() result.
  report.store = await settle(async () => {
    const credential = new PasswordCredential(data);
    await navigator.credentials.store(credential);
  });

  (window.top || window.parent).postMessage(report, "*");
})();
