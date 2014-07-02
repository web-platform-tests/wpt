"use strict";
var vShaderSource = [
    'attribute vec2 coords;',
    'void main() {',
    '    gl_Position = vec4(coords.x, coords.y, 0.0, 1.0);',
    '}'
].join('\n');
var fShaderSource = [
    'precision mediump float;',
    'uniform vec3 color;',
    'void main() {',
    '    gl_FragColor = vec4(color.r, color.g, color.b, 1.0);',
    '}'
].join('\n');
function getWebGLUniformLocation() {
    var context = document.createElement('canvas').getContext('webgl');
    if (!context)
        throw InstantiationError('Unable to obtain WebGLContext instance');
    if (!context['createShader'])
        throw InstantiationError('WebGLContext.createShader is not defined');
     if (!context['shaderSource'])
        throw InstantiationError('WebGLContext.shaderSource is not defined');
    if (!context['compileShader'])
        throw InstantiationError('WebGLContext.compileShader is not defined');
    if (!context['createProgram'])
        throw InstantiationError('WebGLContext.createProgram is not defined');
    if (!context['attachShader'])
        throw InstantiationError('WebGLContext.attachShader is not defined');
    if (!context['linkProgram'])
        throw InstantiationError('WebGLContext.linkProgram is not defined');
    if (!context['useProgram'])
        throw InstantiationError('WebGLContext.useProgram is not defined');
    if (!context['getUniformLocation'])
        throw InstantiationError('WebGLContext.getUniformLocation is not defined');
    var vShader = context.createShader(context.VERTEX_SHADER);
    if (!vShader)
        throw InstantiationError('WebGLContext.createShader did not return WebGLShader instance');
    context.shaderSource(vShader, vShaderSource);
    context.compileShader(vShader);
    if (!context.getShaderParameter(vShader, context.COMPILE_STATUS))
        throw InstantiationError('WebGLContext.compileShader: vertex shader compilation failed: ' + context.getShaderInfoLog(vShader));
    var fShader = context.createShader(context.FRAGMENT_SHADER);
    if (!fShader)
        throw InstantiationError('WebGLContext.createShader did not return WebGLShader instance');
    context.shaderSource(fShader, fShaderSource);
    context.compileShader(fShader);
    if (!context.getShaderParameter(fShader, context.COMPILE_STATUS))
        throw InstantiationError('WebGLContext.compileShader: fragment shader compilation failed: ' + context.getShaderInfoLog(vShader));
    var program = context.createProgram();
    if (!program)
        throw InstantiationError('WebGLContext.createProgram did not return WebGLProgram instance');
    context.attachShader(program, vShader);
    context.attachShader(program, fShader);
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS))
        throw InstantiationError('WebGLContext.linkProgram: program link failed: ' + context.getProgramInfoLog(program));
    context.useProgram(program);
    return context.getUniformLocation(program, "color");
}
