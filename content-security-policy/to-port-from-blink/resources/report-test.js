if (window.testRunner) {
    testRunner.dumpAsText();
    testRunner.dumpPingLoaderCallbacks();
}
if (window.internals)
    internals.settings.setExperimentalContentSecurityPolicyFeaturesEnabled(false);
