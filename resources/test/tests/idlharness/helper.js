function interfaceFrom(i) {
    var idl = new IdlArray();
    idl.add_idls(i);
    return idl.members["A"];
}

function memberFrom(m) {
    var idl = new IdlArray();
    idl.add_idls('interface A { ' + m + '; };');
    return idl.members["A"].members[0];
}