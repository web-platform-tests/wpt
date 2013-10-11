function makeFullScreen(selector) {
	var element = document.querySelector(selector);
	if (selector) {
		selector.webkitRequestFullscreen();
	}
}

function makeFullScreenToggle(selector, targetSelector) {
	var button = document.querySelector(selector);
	button.addEventListener("click", function() {
		var element = document.querySelector(targetSelector);
		if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else {
			document.querySelector("#fail-marker").style.visibility = "visible";
		}
	})
}