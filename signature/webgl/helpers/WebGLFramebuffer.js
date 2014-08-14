"use strict";
function getWebGLFramebuffer() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createFramebuffer'])
        throw InstantiationError('WebGLContext.createFramebuffer is not defined');
    return context.createFramebuffer();
}
