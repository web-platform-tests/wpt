function showPointerTypes() {
	var complete_notice = document.getElementById("complete-notice");
	var pointertype_log = document.getElementById("pointertype-log");
	var pointertypes = Object.keys(detected_pointertypes);
	pointertype_log.innerHTML = pointertypes.length ?
		pointertypes.join(",") : "(none)";
	complete_notice.style.display = "block";
}
