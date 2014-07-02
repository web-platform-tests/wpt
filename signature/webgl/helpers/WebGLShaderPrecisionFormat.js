"use strict";
function getWebGLShaderPrecisionFormat() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context['getShaderPrecisionFormat'])
        throw InstantiationError('WebGLContext.getShaderPrecisionFormat is not defined');
    return context.getShaderPrecisionFormat(context.VERTEX_SHADER, context.MEDIUM_FLOAT);
}
