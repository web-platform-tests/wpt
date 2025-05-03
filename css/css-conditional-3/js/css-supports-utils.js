var parentheticals = [
// supports_declaration_condition
["(margin:0)", true],

// nested production
["((margin:0))", true],

// general_enclosed
["rgb(0,0,0)", false],
["(blue)", false]
];

var compoundParentheticals = [
["(NOT (margin:0))", false],
["((margin:0) AND (border:0))", true],
["((margin:0) OR (border:0))", true],
];
