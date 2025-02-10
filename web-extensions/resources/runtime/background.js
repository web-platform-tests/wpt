async function testGetURLErrorCases() {
	browser.test.assertThrows(() => browser.runtime.getURL())
	browser.test.assertThrows(() => browser.runtime.getURL(null))
	browser.test.assertThrows(() => browser.runtime.getURL(undefined))
	browser.test.assertThrows(() => browser.runtime.getURL(42))
	browser.test.assertThrows(() => browser.runtime.getURL(/test/))

	browser.test.notifyPass()
}

async function testGetURLNormalCases() {
	browser.test.assertEq(typeof browser.runtime.getURL(""), "string")
	browser.test.assertEq(new URL(browser.runtime.getURL("")).pathname, "/")
	browser.test.assertEq(new URL(browser.runtime.getURL("test.js")).pathname, "/test.js")
	browser.test.assertEq(new URL(browser.runtime.getURL("/test.js")).pathname, "/test.js")
	browser.test.assertEq(new URL(browser.runtime.getURL("../../test.js")).pathname, "/test.js")
	browser.test.assertEq(new URL(browser.runtime.getURL("./test.js")).pathname, "/test.js")
	browser.test.assertEq(new URL(browser.runtime.getURL("././/example")).pathname, "//example")
	browser.test.assertEq(new URL(browser.runtime.getURL("../../example/..//test/")).pathname, "//test/")
	browser.test.assertEq(new URL(browser.runtime.getURL(".")).pathname, "/")
	browser.test.assertEq(new URL(browser.runtime.getURL("..//../")).pathname, "/")
	browser.test.assertEq(new URL(browser.runtime.getURL(".././..")).pathname, "/")
	browser.test.assertEq(new URL(browser.runtime.getURL("/.././.")).pathname, "/")

	browser.test.notifyPass()
}

async function testGetPlatformInfo() {
	const platformInfo = await browser.runtime.getPlatformInfo()

	browser.test.assertEq(typeof platformInfo, "object")
	browser.test.assertEq(typeof platformInfo.os, "string")
	browser.test.assertEq(typeof platformInfo.arch, "string")

	browser.test.notifyPass()
}

// FIXME: Safari and Firefox need to implement `browser.test.runTests`, similar to Chrome:
// https://chromium.googlesource.com/chromium/src.git/+/master/extensions/docs/testing_api.md#test_runtests
//
// If so, none of the following setup code to handle running the tests serially would be necessary.

let tests = [
	["browser.runtime.getURL error cases", testGetURLErrorCases],
	["browser.runtime.getURL normal cases", testGetURLNormalCases],
	["browser.runtime.getPlatformInfo", testGetPlatformInfo],
]

async function startNextTest() {
	if (tests.length) {
		const [testName, testMethod] = tests.shift()
		browser.test.sendMessage("test-start", { "testName": testName, "testsRemaining": tests.length })
		await testMethod()
	}
}

browser.test.onMessage.addListener(async (message, data) => {
	switch (message) {
		case "test-suite-setup":
		case "test-finished":
			await startNextTest()
			break
	}
})
