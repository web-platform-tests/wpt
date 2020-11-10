
function testAR({w, h, ew, eh, ar, msg, el}) {
	if(ew === undefined && eh === undefined) throw "Need expectedWidth/Height";
	if(!el) el = document.querySelector(".test");
	else if(typeof el == "string") el = document.querySelector(el);
	el.removeAttribute("style");
	if(!msg) {
		msg = `Given ratio of ${ar}, `;
		if(w !== undefined) msg += `width of ${w}px, `;
		if(h !== undefined) msg += `height of ${h}px, `;
		msg += `then `;
		if(ew !== undefined) msg += `width should be ${ew}px`;
		if(eh !== undefined) msg += `height should be ${eh}px`;
	}
	test(()=>{
		if(w !== undefined) el.style.setProperty("width", w+"px");
		if(h !== undefined) el.style.setProperty("height", h+"px");
		el.style.setProperty("aspect-ratio", ar);
		assert_not_equals(el.style.getPropertyValue("aspect-ratio"), "", `Whoops, '${ar}' isn't parsed as a valid aspect-ratio.`);
		const rect = el.getBoundingClientRect();
		if(ew !== undefined) assert_equals(rect.width, ew);
		if(eh !== undefined) assert_equals(rect.height, eh);
	}, msg)
}