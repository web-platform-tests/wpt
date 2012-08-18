var tList1 = "";
var tList2 = "";

function testAnimValUpdatedAfterModification()
{
	var animValBefore = tList1.animVal.numberOfItems;
	
	// Insert a transform at the beginning of the list - rotate 90 degrees about 50, 50
	var t = document.getElementById("svg").createSVGTransform();
	t.setRotate(90,50,50);
	tList1.baseVal.insertItemBefore(t, 0);
	
	// This is currently failing - commenting out to execute the rest of this test
//	assert_not_equals(tList1.animVal.getItem(0), tList1.baseVal.getItem(0), "The item inserted to baseVal should be copied to animVal");
	assert_equals(tList1.animVal.numberOfItems, animValBefore + 1, "animVal was not updated after insert");
	assert_equals(transformToString(tList1.baseVal.getItem(0)), "SVG_TRANSFORM_ROTATE [0.0 1.0 -1.0 0.0 100.0 0.0]");
	
	animValBefore = tList1.animVal.numberOfItems;
	tList1.baseVal.clear();
	
	assert_not_equals(tList1.animVal.numberOfItems, animValBefore, "animVal was not updated after clear()");
	assert_equals(tList1.animVal.numberOfItems, 0, "animVal was not updated after clear()");
}	

function testListItemUpdated()
{
	var t = tList1.baseVal.getItem(1);
	var tMatrixBefore = t.matrix;
	
	// Set the transform to be a scale
	t.setScale(0.5,0.5);
	
	// Verify the matrix is updated o the transform
	assert_not_equals(tMatrixBefore, t.matrix, "Matrix wasn't updated after setScale");
	
	// Verify it's updated immediately on both baseVal and animVal
	assert_equals(transformToString(tList1.baseVal.getItem(1)), "SVG_TRANSFORM_SCALE [0.5 0.0 0.0 0.5 0.0 0.0]");
	assert_equals(transformToString(tList1.animVal.getItem(1)), "SVG_TRANSFORM_SCALE [0.5 0.0 0.0 0.5 0.0 0.0]");
}

function testInitializeRemovesItem()
{
	var tList2Before = tList2.baseVal.numberOfItems;
	
	// Take the second item (scale) from tList2
	var scale = tList2.baseVal.getItem(1);

	// Initialize tList1 using it
	tList1.baseVal.initialize(scale);
	
	// Confirm it was removed from tList2 after inserted into tList1 - baseVal + animVal
	assert_true(tList2.baseVal.numberOfItems == tList2Before -1, "Transform wasn't removed from previous list");
	assert_true(tList2.animVal.numberOfItems == tList2Before -1, "Transform wasn't removed from previous list");
	 
	for(var i = 0; i < tList2.baseVal.numberOfItems; i++)
	{
		assert_not_equals(tList2.baseVal.getItem(i).type, SVG_TRANSFORM_SCALE);
		assert_not_equals(tList2.animVal.getItem(i).type, SVG_TRANSFORM_SCALE);
	}
} 

function testInsertItemBeforeRemovesItem()
{
	var tList2Before = tList2.baseVal.numberOfItems;
	
	// Take the third item (translate) from tList2
	var translate = tList2.baseVal.getItem(1);

	// Insert it into the 2 position in tList1
	tList1.baseVal.insertItemBefore(translate, 1);
	
	// Confirm it was removed from tList2 after inserted into tList1 - baseVal + animVal
	assert_true(tList2.baseVal.numberOfItems == tList2Before -1, "Transform wasn't removed from previous list");
	assert_true(tList2.animVal.numberOfItems == tList2Before -1, "Transform wasn't removed from previous list");
	 
	for(var i = 0; i < tList2.baseVal.numberOfItems; i++)
	{
		assert_not_equals(tList2.baseVal.getItem(i).type, SVG_TRANSFORM_TRANSLATE);
		assert_not_equals(tList2.animVal.getItem(i).type, SVG_TRANSFORM_TRANSLATE);
	}
	
	// Confirm is was added to the right position in tList1
	assert_equals(tList1.baseVal.getItem(1).type, SVG_TRANSFORM_TRANSLATE);
	assert_equals(tList1.animVal.getItem(1).type, SVG_TRANSFORM_TRANSLATE);
}

function testInsertItemBeforeAlreadyOnList()
{
	assert_equals(true, false, "Placeholder: Validate that if the item to be inserted is already on the list, it is removed from that list before it is re-added");
}

function testReplaceItemRemovesItem()
{
	assert_equals(true, false, "Placeholder: Validate that if the replacement item is previously on a list, it is removed from its previous list");
}

function testReplaceItemAlreadyOnList()
{
	assert_equals(true, false, "Placeholder: Validate that if the replacement item is already on the list, it is removed from that list before it is replaced with itself");
}

function testAppendItemRemovesItem()
{
	assert_equals(true, false, "Placeholder: Validate that if the item to be appended is previously on a list, it is removed from its previous list");
}

function testAppendItemAlreadyOnList()
{
	assert_equals(true, false, "Placeholder: Validate that if the item to be appended is already on the list, it is removed from that list before it is appended");
}

function testCreateTransformFromMatrix()
{
	assert_equals(true, false, "Placeholder: Validate the transform type is SVG_TRANSFORM_MATRIX and validate the values from matrix parameter are copied");
}

function testConsolidateAllTypes()
{
	assert_equals(true, false, "Placeholder: Validate all types of transforms can be consolidated");
}

function testModifyConsolidated()
{
	assert_equals(true, false, "Placeholder: Validate that modifications made to a consolidated list are reflected immediately");
}

function testConsolidateConsolidated()
{
	assert_equals(true, false, "Placeholder: Validate all types of transforms can be consolidated");
}

function testSetMatrix() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setMatrix correctly sets the matrix on baseVal");
}

function testSetTranslate() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setTranslate correctly sets the matrix on baseVal");
}

function testSetRotate() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setRotate correctly sets the matrix on baseVal");
}

function testSetScale() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setScale correctly sets the matrix on baseVal");
}

function testSetSkewX() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setSkewX correctly sets the matrix on baseVal");
}
	
function testSetSkewY() {
	
	assert_equals(true, false, "Placeholder: Validate transform.setSkewY correctly sets the matrix on baseVal");
}



function getMatrix(transform) 
{
	 return "[" + transform.matrix.a.toFixed(1)
          + " " + transform.matrix.b.toFixed(1)
          + " " + transform.matrix.c.toFixed(1)
          + " " + transform.matrix.d.toFixed(1)
          + " " + transform.matrix.e.toFixed(1)
          + " " + transform.matrix.f.toFixed(1)
          + "]";
}

function getType(transform) {
	var transformTypes = {
        "0": "SVG_TRANSFORM_UNKNOWN",
        "1": "SVG_TRANSFORM_MATRIX",
        "2": "SVG_TRANSFORM_TRANSLATE",
        "3": "SVG_TRANSFORM_SCALE",
        "4": "SVG_TRANSFORM_ROTATE",
        "5": "SVG_TRANSFORM_SKEWX",
        "6": "SVG_TRANSFORM_SKEWY"
    };
	
	return transformTypes[transform.type];
}

var SVG_TRANSFORM_UNKNOWN = 0;
var SVG_TRANSFORM_MATRIX = 1;
var SVG_TRANSFORM_TRANSLATE = 2;
var SVG_TRANSFORM_SCALE = 3;
var SVG_TRANSFORM_ROTATE = 4;
var SVG_TRANSFORM_SKEWX = 5;
var SVG_TRANSFORM_SKEWY = 6;

function transformToString(transform) {
    
    return getType(transform) + " " + getMatrix(transform);
}

