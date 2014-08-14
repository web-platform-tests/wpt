"use strict";
function getWebGLProgram() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createProgram'])
        throw InstantiationError('WebGLContext.createProgram is not defined');
    return context.createProgram();
}
