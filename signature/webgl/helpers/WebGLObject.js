"use strict";
function getWebGLObject() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createBuffer'])
        throw InstantiationError('WebGLContext.createBuffer is not defined');
    return context.createBuffer();
}
