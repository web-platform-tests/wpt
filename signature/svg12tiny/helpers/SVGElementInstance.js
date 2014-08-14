"use script";
function getSVGElementInstanceAsync(test) {
    var rct = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rct.setAttributeNS(null, 'id', 'rect');
    rct.setAttributeNS(null, 'x', '50');
    rct.setAttributeNS(null, 'y', '50');
    rct.setAttributeNS(null, 'width', '50');
    rct.setAttributeNS(null, 'height', '50');
    rct.setAttributeNS(null, 'fill', 'blue');
    rct.setAttributeNS(null, 'stroke', 'blue');
    var dfs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    dfs.appendChild(rct);
    var use = document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttributeNS(null, 'id', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#rect');
    use.addEventListener('click', test.step_func_done(function(evt) {
        level1TestInstance(evt.target, test.properties.def);
        done();
    }), false);
    var txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttributeNS(null, 'x', '15');
    txt.setAttributeNS(null, 'y', '140');
    txt.setAttributeNS(null, 'font-family', 'sans-serif');
    txt.setAttributeNS(null, 'font-size', '24');
    txt.setAttributeNS(null, 'font-weight', 'bold');
    txt.setAttributeNS(null, 'fill', 'blue');
    txt.textContent = 'Click Box!';
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.appendChild(dfs);
    svg.appendChild(txt);
    svg.appendChild(use);
    document.body.appendChild(svg);
}
