"use strict";
// This test depends on presence of support for the ES6 Set Object type, a dependency that
// derives from the CSS Font Loading Module Level 3 specification itself.
// To test in chrome, requires enabling chrome://flags/#enable-javascript-harmony.
function getFontFace() {
    if (!('fonts' in document))
        throw new InstantiationError('Document.fonts is not defined.');
    var fonts = document.fonts;
    if (!('size' in fonts))
        throw new InstantiationError('document.fonts.size is not defined.');
    if (fonts.size == 0)
        throw new InstantiationError('document.fonts.size is zero.');
    if (!('forEach' in fonts))
        throw new InstantiationError('document.fonts.forEach is not defined.');
    var fontFace;
    fonts.forEach(function(face) {
        if (!fontFace)
            fontFace = face;
    });
    return fontFace;
}
