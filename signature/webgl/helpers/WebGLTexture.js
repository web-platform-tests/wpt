"use strict";
function getWebGLTexture() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createTexture'])
        throw InstantiationError('WebGLContext.createTexture is not defined');
    return context.createTexture();
}
