add_start_callback(setUp);
add_result_callback(setUp);

var transform, t1, t2, t3 = "";

test( testAnimValNumberOfItemsReadOnly, "testAnimValNumberOfItemsReadOnly", {assert: 'animVal.numberOfItems is read-only'} );    
test( testAnimValInitialize, "testAnimValInitialize", {assert: 'animVal.initialize() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValClear, "testAnimValClear", {assert: 'animVal.clear() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValInsertItemBefore, "testAnimValInsertItemBefore", {assert: 'animVal.testAnimValInsertItemBefore() throws NO_MODIFICATION_ALLOWED_ERR'} );    
test( testAnimValReplaceItem, "testAnimValReplaceItem", {assert: 'animVal.testAnimValReplaceItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValAppendItem, "testAnimValAppendItem", {assert: 'animVal.testAnimValAppendItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValRemoveItem, "testAnimValRemoveItem", {assert: 'animVal.testAnimValRemoveItem() throws NO_MODIFICATION_ALLOWED_ERR'} );   
test( testAnimValCreateSVGTransformFromMatrix, "testAnimValCreateSVGTransformFromMatrix", {assert: 'animVal.createSVGTransformFromMatrix() creates a new SVGTransform object'} );    
test( testAnimValConsolidate, "testAnimValConsolidate", {assert: 'Validate animVal.testAnimValConsolidate() throws NO_MODIFICATION_ALLOWED_ERR'} );
test( testBaseValNumberOfItemsReadOnly, "testBaseValNumberOfItemsReadOnly", {assert: 'baseVal.numberOfItems is read-only'} );    
test( testBaseValInitialize, "testBaseValInitialize", {assert: 'baseVal.initialize() clears and inserts a new item'} );    
test( testBaseValInsertItemBefore, "testBaseValInsertItemBefore", {assert: 'baseVal.insertItemBefore() inserts item before specified index'} );    
test( testBaseValReplaceItem, "testBaseValReplaceItem", {assert: 'baseVal.replaceItem() replaces the item at the specified index'} );    
test( testBaseValAppendItem, "testBaseValAppendItem", {assert: 'baseVal.appendItem() appends item to the list'} );
test( testBaseValRemoveItem, "testBaseValRemoveItem", {assert: 'baseVal.removeItem() removes item from the list'} );
test( testBaseValCreateSVGTransformFromMatrix, "testBaseValCreateSVGTransformFromMatrix", {assert: 'baseVal.createSVGTransformFromMatrix creates a new SVGTransform object'} );    
test( testBaseValConsolidate, "testBaseValConsolidate", {assert: 'baseVal.consolidate() consolidates the list into a single transfrom'} );
test( testBaseValConsolidateEmptyList, "testBaseValConsolidateEmptyList", {assert: 'baseVal.consolidate() on an empty list returns null'} );
test( testBaseValClear, "testBaseValClear", {assert: 'baseVal.clear() clears all transforms'} );   
test( testBaseValInitializeInvalid, "testBaseValInitializeInvalid", {assert: 'baseVal.initialize() throws exception when passed an arg not in SVGTransform'} );     
test( testBaseValGetItemInvalid, "testBaseValGetItemInvalid", {assert: 'baseVal.getItem() handles invalid arguments correctly'} );     
test( testBaseValInsertItemBeforeInvalid, "testBaseValInsertItemBeforeInvalid", {assert: 'baseVal.insertItemBefore() handles invalid arguments correctly'} );    
test( testBaseValReplaceItemInvalid, "testBaseValReplaceItemInvalid", {assert: 'baseVal.replaceItem() handles invalid arguments correctly'} );    
test( testBaseValAppendItemInvalid, "testBaseValAppendItemInvalid", {assert: 'baseVal.appendItem() handles invalid arguments correctly'} );    
test( testBaseValRemoveItemInvalid, "testBaseValRemoveItemInvalid", {assert: 'baseVal.removeItem() handles invalid arguments correctly'} );  
test( testBaseValCreateSVGTransformFromMatrixInvalid, "testBaseValCreateSVGTransformFromMatrixInvalid", {assert: 'baseVal.createSVGTransformFromMatrix handles invalid arguments correctly'} );    


function setUp() {
	
	transform = document.getElementById("testRect").transform;
	
	t1 = document.getElementById("svg").createSVGTransform();
	t2 = document.getElementById("svg").createSVGTransform();
	t3 = document.getElementById("svg").createSVGTransform();
	
	transform.baseVal.clear();
	transform.baseVal.initialize(t1);
	transform.baseVal.appendItem(t2);
	transform.baseVal.appendItem(t3);
}

function testAnimValNumberOfItemsReadOnly()
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

function testBaseValNumberOfItemsReadOnly()
{
	assert_readonly(transform.baseVal, "numberOfItems", "baseVal.numberOfItems should be read only");
}

function testBaseValInitialize()
{
	var t = document.getElementById("svg").createSVGTransform();
	assert_equals(t, transform.baseVal.initialize(t));
}

function testBaseValInsertItemBefore()
{
	var t1 = transform.baseVal.getItem(0);
	var t2 = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	var ret = transform.baseVal.insertItemBefore(t2, 0);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_equals(t2, ret, "baseVal.insertItemBefore() should return the inserted item");
	assert_true(numItemsAfter == numItemsBefore + 1, "There should be 1 transform added to the list");
	assert_equals(t2, transform.baseVal.getItem(0), "Transform 2 was not inserted before Transform 1");
	assert_equals(t1, transform.baseVal.getItem(1), "Transform 1 is not in the correct position");
}

function testBaseValReplaceItem()
{
	var t1 = transform.baseVal.getItem(0);
	var t2 = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	var ret = transform.baseVal.replaceItem(t2, 0);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_equals(t2, ret, "baseVal.replaceItem() should return the inserted item");
	assert_equals(numItemsBefore, numItemsAfter, "The list size should remain the same");
	assert_equals(t2, transform.baseVal.getItem(0), "Transform 2 did not replace Transform 1");
}

function testBaseValAppendItem()
{
	var t = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	var ret = transform.baseVal.appendItem(t);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_equals(t, ret, "baseVal.appendItem() should return the inserted item");
	assert_true(numItemsAfter == numItemsBefore + 1, "There should be 1 transform added to the list");
	assert_equals(t, transform.baseVal.getItem(numItemsAfter-1), "Transform was not appended");
}

function testBaseValRemoveItem()
{
	var numItemsBefore = transform.baseVal.numberOfItems;
	var itemToRemove = transform.baseVal.getItem(numItemsBefore-1)
	
	var ret = transform.baseVal.removeItem(numItemsBefore-1);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_equals(itemToRemove, ret, "baseVal.removeItem() should return the removed item");
	assert_true(numItemsAfter == numItemsBefore - 1, "There should be 1 transform removed from the list");
}

function testBaseValCreateSVGTransformFromMatrix()
{
	var matrix = document.getElementById("svg").createSVGTransform().matrix;
	var t = transform.baseVal.createSVGTransformFromMatrix(matrix);

	assert_equals(matrixToString(matrix), matrixToString(t.matrix), "animVal.createSVGTransformFromMatrix should succeed");	
}

function testBaseValConsolidate()
{
	if(transform.baseVal.numberOfItems == 1)
	{
		var t = document.getElementById("svg").createSVGTransform();
		transform.baseVal.appendItem(t);
	}
	
	transform.baseVal.consolidate();
	
	// TODO Validate the matrix consolidation was correct by consolidating 2 different types
	assert_equals(1, transform.baseVal.numberOfItems, "The list should be consolidated into 1 item");
}

function testBaseValConsolidateEmptyList()
{
	transform.baseVal.clear();
	assert_equals(null, transform.baseVal.consolidate());
}

function testBaseValClear()
{
	assert_true(transform.baseVal.numberOfItems > 0, "There should be at least 1 transform on the testRect");
	transform.baseVal.clear();
	assert_equals(0, transform.baseVal.numberOfItems, "There should be an empty transform list after the clear()");
	assert_throws(null, function(){transform.baseVal.getItem(0)}, "baseVal.getItem() on an empty list should throw an error");
}

function testBaseValInitializeInvalid()
{
	assert_throws(null, function(){transform.baseVal.initialize(null)}, "baseVal.initialize(null) should throw an error");
	assert_throws(null, function(){transform.baseVal.initialize(30)}, "baseVal.initialize(30) should throw an error");
	assert_throws(null, function(){transform.baseVal.initialize("someString")}, "initialize('someString') should throw an error");
	assert_throws(null, function(){transform.baseVal.initialize(new Object())}, "initialize(new Object()) should throw an error");
}

function testBaseValGetItemInvalid()
{
	assert_throws(null, function(){transform.baseVal.getItem(30)}, "baseVal.getItem(30) should throw an error");
	assert_equals(transform.baseVal.getItem(0), transform.baseVal.getItem(null), "baseVal.getItem(null) should return baseVal.getItem(0)");
	assert_equals(transform.baseVal.getItem(0), transform.baseVal.getItem("someString"), "baseVal.getItem('someString') should return baseVal.getItem(0)");
	assert_equals(transform.baseVal.getItem(0), transform.baseVal.getItem(new Object()), "baseVal.getItem(new Object()) should return baseVal.getItem(0)");
}

function testBaseValInsertItemBeforeInvalid()
{
	var t = document.getElementById("svg").createSVGTransform();
	
	// Specifying an index out of range should result in the item being appended
	var ret = transform.baseVal.insertItemBefore(t, transform.baseVal.numberOfItems+5);
	assert_equals(t, ret, "baseVal.insertItemBefore(t, 30) should return the inserted item");
	assert_equals(t, transform.baseVal.getItem(3), "baseVal.insertItemBefore(t, 30) should append the item to the list");
	
	assert_throws(null, function(){transform.baseVal.insertItemBefore(null, 0)}, "baseVal.insertItemBefore(null, 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.insertItemBefore("someString", 0)}, "baseVal.insertItemBefore('someString', 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.insertItemBefore(new Object(), 0)}, "baseVal.insertItemBefore(new Object(), 0) should throw an error");
	
	// Should an error be thrown if arg2 is invalid? Nothing in spec and no error is thrown so these currently fail as they are. 
	/*
	assert_throws(null, function(){transform.baseVal.insertItemBefore(t, null)}, "baseVal.insertItemBefore(t, null) should throw an error");
	assert_throws(null, function(){transform.baseVal.insertItemBefore(t, "someString")}, "baseVal.insertItemBefore(t, 'someString') should throw an error");
	assert_throws(null, function(){transform.baseVal.insertItemBefore(t, new Object())}, "baseVal.insertItemBefore(t, new Object()) should throw an error");
	*/
}

function testBaseValReplaceItemInvalid()
{
	assert_throws(null, function(){transform.baseVal.replaceItem(null, 0)}, "baseVal.replaceItem(null, 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.replaceItem("someString", 0)}, "baseVal.replaceItem('someString', 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.replaceItem(new Object(), 0)}, "baseVal.replaceItem(new Object(), 0) should throw an error");
	
	// Should an error be thrown if arg2 is invalid? Nothing in spec and no error is thrown so these currently fail as they are. 
	/*
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws(null, function(){transform.baseVal.replaceItem(t, null)}, "baseVal.replaceItem(t, null) should throw an error");
	assert_throws(null, function(){transform.baseVal.replaceItem(t, "someString")}, "baseVal.replaceItem(t, 'someString') should throw an error");
	assert_throws(null, function(){transform.baseVal.replaceItem(t, new Object())}, "baseVal.replaceItem(t, new Object()) should throw an error");
	*/
}

function testBaseValAppendItemInvalid()
{
	assert_throws(null, function(){transform.baseVal.appendItem(null, 0)}, "baseVal.appendItem(null, 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.appendItem("someString", 0)}, "baseVal.appendItem('someString', 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.appendItem(new Object(), 0)}, "baseVal.appendItem(new Object(), 0) should throw an error");
	
	// Should an error be thrown if arg2 is invalid? Nothing in spec and no error is thrown so these currently fail as they are. 
	/*
	var t = document.getElementById("svg").createSVGTransform();
	assert_throws(null, function(){transform.baseVal.appendItem(t, null)}, "baseVal.appendItem(t, null) should throw an error");
	assert_throws(null, function(){transform.baseVal.appendItem(t, "someString")}, "baseVal.appendItem(t, 'someString') should throw an error");
	assert_throws(null, function(){transform.baseVal.appendItem(t, new Object())}, "baseVal.appendItem(t, new Object()) should throw an error");
	*/
}

function testBaseValRemoveItemInvalid()
{
	assert_throws(null, function(){transform.baseVal.removeItem(10)}, "baseVal.removeItem() should throw an error on invalid index");
	assert_throws(null, function(){transform.baseVal.removeItem(-1)}, "baseVal.removeItem() should throw an error on invalid index");
	
	// Should an error be thrown if the arg is an invalid type? Nothing in spec and no error is thrown so these currently fail as they are. 
	/*
	assert_throws(null, function(){transform.baseVal.removeItem(null)}, "baseVal.removeItem() should throw an error on invalid index");
	assert_throws(null, function(){transform.baseVal.removeItem("someString")}, "baseVal.removeItem() should throw an error on invalid index");
	assert_throws(null, function(){transform.baseVal.removeItem(new Object())}, "baseVal.removeItem() should throw an error on invalid index");
	*/
}


function testBaseValCreateSVGTransformFromMatrixInvalid()
{
	assert_throws(null, function(){transform.baseVal.createSVGTransformFromMatrix(null)}, "baseVal.createSVGTransformFromMatrix(null) should throw an error");
	assert_throws(null, function(){transform.baseVal.createSVGTransformFromMatrix("someString")}, "baseVal.createSVGTransformFromMatrix('someString', 0) should throw an error");
	assert_throws(null, function(){transform.baseVal.createSVGTransformFromMatrix(new Object())}, "baseVal.createSVGTransformFromMatrix(new Object(), 0) should throw an error");
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