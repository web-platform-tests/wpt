"use strict";
function getCanvasPattern() {
    var image = document.createElement('img');
    image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';
    return document.createElement('canvas').getContext('2d').createPattern(image, 'no-repeat');
}
