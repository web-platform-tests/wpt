"use strict";
function getWebGLShader() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['createShader'])
        throw InstantiationError('WebGLContext.createShader is not defined');
    return context.createShader(context.VERTEX_SHADER);
}
