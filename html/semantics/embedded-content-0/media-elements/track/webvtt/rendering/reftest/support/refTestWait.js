var refTestTimer = setTimeout(function() {}, 30000);

function takeScreenshot() {
	clearTimeout(refTestTimer);
}

function takeScreenshotDelayed(timeout) {
	setTimeout(function() {
		clearTimeout(refTestTimer);
	}, timeout);
}
