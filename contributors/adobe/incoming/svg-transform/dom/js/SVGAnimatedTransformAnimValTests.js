var transform = document.getElementById("testRect").transform;

test( testAnimVal, "testAnimVal", {assert: 'animVal.numberOfItems is read-only'} );    
test( testAnimValInitialize, "testAnimValInitialize", {assert: 'animVal.initialize() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValClear, "testAnimValClear", {assert: 'animVal.clear() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValInsertItemBefore, "testAnimValInsertItemBefore", {assert: 'animVal.testAnimValInsertItemBefore() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValReplaceItem, "testAnimValReplaceItem", {assert: 'animVal.testAnimValReplaceItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValAppendItem, "testAnimValAppendItem", {assert: 'animVal.testAnimValAppendItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValRemoveItem, "testAnimValRemoveItem", {assert: 'animVal.testAnimValRemoveItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValCreateSVGTransformFromMatrix, "testAnimValCreateSVGTransformFromMatrix", {assert: 'animVal.createSVGTransformFromMatrix() creates a new SVGTransform object'} );    
test( testAnimValConsolidate, "testAnimValConsolidate", {assert: 'Validate animVal.testAnimValConsolidate() throws NO_MODIFICATION_ALLOWED_ERR'} );
    

function testAnimVal()
{
	assert_readonly(transform.animVal, "numberOfItems", "animVal.numberOfItems should be read only");
}

function testAnimValInitialize()
{
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.initialize(t)}, "animVal.initialize() should throw NO_MODIFICATION_ALLOWED_ERR"); 
}

function testAnimValClear()
{
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.clear()}, "animVal.clear() should throw NO_MODIFICATION_ALLOWED_ERR"); 
}

function testAnimValInsertItemBefore()
{
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.insertItemBefore(t, 0)}, "animVal.insertItemBefore should throw NO_MODIFICATION_ALLOWED_ERR");
}

function testAnimValReplaceItem()
{
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.replaceItem(t, 0)}, "animVal.replaceItem should throw NO_MODIFICATION_ALLOWED_ERR");
}

function testAnimValAppendItem()
{
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.appendItem(t)}, "animVal.appendItem should throw NO_MODIFICATION_ALLOWED_ERR");
}

function testAnimValRemoveItem()
{
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.removeItem(0)}, "animVal.removeItem should throw NO_MODIFICATION_ALLOWED_ERR");
}

function testAnimValCreateSVGTransformFromMatrix()
{
	
	var matrix = document.getElementById("svg").createSVGTransform().matrix;
	var t = transform.animVal.createSVGTransformFromMatrix(matrix);
	
	assert_equals(matrixToString(matrix), matrixToString(t.matrix), "animVal.createSVGTransformFromMatrix should succeed");	
}

function testAnimValConsolidate()
{
	assert_throws({name: 'NO_MODIFICATION_ALLOWED_ERR'}, function(){transform.animVal.consolidate()}, "animVal.consolidate should throw NO_MODIFICATION_ALLOWED_ERR");
}

function matrixToString(matrix) 
{
	 return "[" + matrix.a.toFixed(1)
          + " " + matrix.b.toFixed(1)
          + " " + matrix.c.toFixed(1)
          + " " + matrix.d.toFixed(1)
          + " " + matrix.e.toFixed(1)
          + " " + matrix.f.toFixed(1)
          + "]";
}
