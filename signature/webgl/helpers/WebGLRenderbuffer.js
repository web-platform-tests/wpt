"use strict";
function getWebGLRenderbuffer() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createRenderbuffer'])
        throw InstantiationError('WebGLContext.createRenderbuffer is not defined');
    return context.createRenderbuffer();
}
