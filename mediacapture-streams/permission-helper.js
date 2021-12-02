async function setPermission(status="granted", scope=["camera", "microphone"]) {
  try {
    for (let s of scope) {
      await test_driver.set_permission({ name: s }, status, true);
    }
  } catch {
    // Web Driver not implemented action
    // will default to granted state for FF and Safari
  }
}
