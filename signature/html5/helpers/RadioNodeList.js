"use strict";
function getRadioNodeList() {
    var f = document.createElement('form');
    if (!f)
        throw new InstantiationError('Document.createElement failed for form element type.');
    var e1 = document.createElement('input');
    if (!e1)
        throw new InstantiationError('Document.createElement failed for input element type.');
    e1.type = 'radio';
    e1.name = 'test';
    var e2 = document.createElement('input');
    if (!e2)
        throw new InstantiationError('Document.createElement failed for input element type.');
    e2.type = 'radio';
    e2.name = 'test';
    f.appendChild(e1);
    f.appendChild(e2);
    document.body.appendChild(f);
    return f['test'];
}