"use strict";
function getStyleSheetList() {
    if (document['styleSheets'] === undefined)
        throw new InstantiationError('Document.styleSheets is not defined');
    return document.styleSheets;
}