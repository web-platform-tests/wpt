add_start_callback(setUp);
add_result_callback(setUp)

var transform = "";

test( testBaseValInitialize, "testBaseValInitialize", {assert: 'baseVal.initialize() clears and inserts a new item'} );    
test( testBaseValInsertItemBefore, "testBaseValInsertItemBefore", {assert: 'baseVal.insertItemBefore() inserts item before specified index'} );    
test( testBaseValReplaceItem, "testBaseValReplaceItem", {assert: 'baseVal.replaceItem() replaces the item at the specified index'} );    
test( testBaseValAppendItem, "testBaseValAppendItem", {assert: 'baseVal.appendItem() appends item to the list'} );
test( testBaseValRemoveItem, "testBaseValRemoveItem", {assert: 'baseVal.removeItem() removes item from the list'} );
test( testBaseValCreateSVGTransformFromMatrix, "testBaseValCreateSVGTransformFromMatrix", {assert: 'baseVal.createSVGTransformFromMatrix creates a new SVGTransform object'} );    
test( testBaseValConsolidate, "testBaseValConsolidate", {assert: 'baseVal.consolidate() consolidates the list into a single transfrom'} );
test( testBaseValClear, "testBaseValClear", {assert: 'baseVal.clear() clears all transforms'} );    


function setUp() {
	
	transform = document.getElementById("testRect").transform;
	
	var t1 = document.getElementById("svg").createSVGTransform();
	var t2 = document.getElementById("svg").createSVGTransform();
	var t3 = document.getElementById("svg").createSVGTransform();
	
	transform.baseVal.initialize(t1);
	transform.baseVal.appendItem(t2);
	transform.baseVal.appendItem(t3);
}

function testBaseValInitialize()
{
	var expected = document.getElementById("svg").createSVGTransform();
	var actual = transform.baseVal.initialize(expected);
	assert_equals(actual, expected);
}

function testBaseValInsertItemBefore()
{
	var t1 = transform.baseVal.getItem(0);
	var t2 = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	transform.baseVal.insertItemBefore(t2, 0);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_true(numItemsAfter == numItemsBefore + 1, "There should be 1 transform added to the list");
	assert_equals(transform.baseVal.getItem(0), t2, "Transform 2 was not inserted before Transform 1");
	assert_equals(transform.baseVal.getItem(1), t1, "Transform 1 is not in the correct position");
}

function testBaseValReplaceItem()
{
	var t1 = transform.baseVal.getItem(0);
	var t2 = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	transform.baseVal.replaceItem(t2, 0);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_equals(numItemsAfter, numItemsBefore, "The list size should remain the same");
	assert_equals(transform.baseVal.getItem(0), t2, "Transform 2 did not replace Transform 1");
}

function testBaseValAppendItem()
{
	var t = document.getElementById("svg").createSVGTransform();
	
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	transform.baseVal.appendItem(t);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
	assert_true(numItemsAfter == numItemsBefore + 1, "There should be 1 transform added to the list");
	assert_equals(transform.baseVal.getItem(numItemsAfter-1), t, "Transform was not appended");
}

function testBaseValRemoveItem()
{
	var numItemsBefore = transform.baseVal.numberOfItems;
	
	transform.baseVal.removeItem(numItemsBefore-1);
	var numItemsAfter = transform.baseVal.numberOfItems;
	
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
	// TODO Test consolidating an empty list
		
	assert_equals(transform.baseVal.numberOfItems, 1, "The list should be consolidated into 1 item");
}

function testBaseValClear()
{
	assert_true(transform.baseVal.numberOfItems > 0, "There should be at least 1 transform on the testRect");
	transform.baseVal.clear();
	assert_equals(transform.baseVal.numberOfItems, 0, "There should be an empty transform list after the clear()");
	assert_throws({name: 'INDEX_SIZE_ERR'}, function(){transform.baseVal.getItem(0)}, "baseVal.getItem should throw INDEX_SIZE_ERR");
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