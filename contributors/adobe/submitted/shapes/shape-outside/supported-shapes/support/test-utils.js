function verifyTextPoints(shape, numLines) {
    var expected = getRoundedRectLeftEdge(shape);
    
    for(var i = 0; i < numLines; i++) {
       var line = document.getElementById('test'+i);
       var actual = line.getBoundingClientRect().left;
       
        if( Math.abs( (actual - expected[i])) > .5 ){
            line.style.setProperty('color', 'red');
            console.log('diff: ' + Math.abs(actual - expected[i]));
        }
    }
}
