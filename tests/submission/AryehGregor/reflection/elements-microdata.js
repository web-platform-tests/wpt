// Things defined in the W3C's microdata draft, not the main HTML5 draft.
// Note: must be included last so that it hits all elements.

for (var element in elements) {
	elements[element].itemScope = "boolean";
	elements[element].itemType = "string";
	elements[element].itemId = "string";
}
extraTests.push(function() {
	// itemValue only reflects in certain circumstances.  The syntax for our big
	// array thing above doesn't currently support one IDL attribute that reflects
	// different content attributes, so just do this explicitly until that's fixed.
	ReflectionTests.reflects("string", "itemValue", "meta", "content");
	ReflectionTests.reflects("url", "itemValue", "audio", "src");
	ReflectionTests.reflects("url", "itemValue", "embed", "src");
	ReflectionTests.reflects("url", "itemValue", "iframe", "src");
	ReflectionTests.reflects("url", "itemValue", "img", "src");
	ReflectionTests.reflects("url", "itemValue", "source", "src");
	ReflectionTests.reflects("url", "itemValue", "video", "src");
	ReflectionTests.reflects("url", "itemValue", "a", "href");
	ReflectionTests.reflects("url", "itemValue", "area", "href");
	ReflectionTests.reflects("url", "itemValue", "link", "href");
	ReflectionTests.reflects("url", "itemValue", "object", "data");
	ReflectionTests.reflects("url", "itemValue", "time", "datetime");
});
