function verifyPreloadAndRTSupport()
{
    var link = window.document.createElement("link");
    var preloadSupported = link.relList && link.relList.supports("preload");
    assert_true(preloadSupported && !!window.PerformanceResourceTiming, "Browser doesn't support preload or ResourceTiming.");
}

function getAbsoluteURL(url)
{
    return new URL(url, location.href).href;
}

function verifyNumberOfDownloads(url, number)
{
    assert_equals(performance.getEntriesByName(getAbsoluteURL(url)).length, number, url);
}
